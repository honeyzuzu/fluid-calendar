import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { isPresenceOnline } from "@/lib/presence";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "friends-route";
const VISIBILITIES = new Set(["NONE", "BUSY_ONLY", "DETAILS"]);

function pairKey(first: string, second: string) {
  return [first, second].sort().join(":");
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  lastActiveAt: true,
} as const;

type FriendUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  lastActiveAt: Date | null;
};

function presentConnection(
  connection: {
    id: string;
    status: string;
    requesterId: string;
    addresseeId: string;
    requesterVisibility: string;
    addresseeVisibility: string;
    createdAt: Date;
    acceptedAt: Date | null;
    requester: FriendUser;
    addressee: FriendUser;
  },
  userId: string
) {
  const sentByMe = connection.requesterId === userId;
  const friend = sentByMe ? connection.addressee : connection.requester;
  return {
    id: connection.id,
    status: connection.status,
    direction: sentByMe ? "outgoing" : "incoming",
    friend: {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      image: friend.image,
      online: isPresenceOnline(friend.lastActiveAt, new Date()),
    },
    myVisibility: sentByMe
      ? connection.requesterVisibility
      : connection.addresseeVisibility,
    theirVisibility: sentByMe
      ? connection.addresseeVisibility
      : connection.requesterVisibility,
    createdAt: connection.createdAt,
    acceptedAt: connection.acceptedAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const connections = await prisma.friendConnection.findMany({
    where: { OR: [{ requesterId: auth.userId }, { addresseeId: auth.userId }] },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    connections.map((item) => presentConnection(item, auth.userId))
  );
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as { email?: unknown };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email)
    return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const friend = await prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });
  if (!friend) {
    return NextResponse.json(
      {
        error:
          "No account uses that email yet. Ask your friend to sign up first.",
      },
      { status: 404 }
    );
  }
  if (friend.id === auth.userId) {
    return NextResponse.json(
      { error: "You cannot add yourself" },
      { status: 400 }
    );
  }

  const key = pairKey(auth.userId, friend.id);
  const existing = await prisma.friendConnection.findUnique({
    where: { pairKey: key },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A friend request or connection already exists" },
      { status: 409 }
    );
  }

  const connection = await prisma.friendConnection.create({
    data: { pairKey: key, requesterId: auth.userId, addresseeId: friend.id },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });
  return NextResponse.json(presentConnection(connection, auth.userId), {
    status: 201,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as {
    id?: unknown;
    action?: unknown;
    visibility?: unknown;
  };
  if (typeof body.id !== "string") {
    return NextResponse.json(
      { error: "Connection ID is required" },
      { status: 400 }
    );
  }
  const connection = await prisma.friendConnection.findUnique({
    where: { id: body.id },
  });
  if (
    !connection ||
    (connection.requesterId !== auth.userId &&
      connection.addresseeId !== auth.userId)
  ) {
    return NextResponse.json(
      { error: "Friend connection not found" },
      { status: 404 }
    );
  }

  if (body.action === "accept") {
    if (
      connection.addresseeId !== auth.userId ||
      connection.status !== "PENDING"
    ) {
      return NextResponse.json(
        { error: "This request cannot be accepted" },
        { status: 400 }
      );
    }
    await prisma.friendConnection.update({
      where: { id: connection.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  } else if (body.action === "decline") {
    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be declined" },
        { status: 400 }
      );
    }
    await prisma.friendConnection.delete({ where: { id: connection.id } });
    return NextResponse.json({ removed: true });
  } else if (body.action === "visibility") {
    if (
      connection.status !== "ACCEPTED" ||
      typeof body.visibility !== "string" ||
      !VISIBILITIES.has(body.visibility)
    ) {
      return NextResponse.json(
        { error: "Choose hidden, busy only, or full details" },
        { status: 400 }
      );
    }
    await prisma.friendConnection.update({
      where: { id: connection.id },
      data:
        connection.requesterId === auth.userId
          ? { requesterVisibility: body.visibility }
          : { addresseeVisibility: body.visibility },
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const updated = await prisma.friendConnection.findUniqueOrThrow({
    where: { id: connection.id },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });
  return NextResponse.json(presentConnection(updated, auth.userId));
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { error: "Connection ID is required" },
      { status: 400 }
    );

  const result = await prisma.friendConnection.deleteMany({
    where: {
      id,
      OR: [{ requesterId: auth.userId }, { addresseeId: auth.userId }],
    },
  });
  if (!result.count)
    return NextResponse.json(
      { error: "Friend connection not found" },
      { status: 404 }
    );
  return NextResponse.json({ removed: true });
}
