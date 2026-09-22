import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

describe("responsive application shell", () => {
  it("switches to icon navigation before constrained layouts clip", () => {
    const navigation = read("src/components/navigation/AppNav.tsx");
    const layout = read("src/app/(common)/layout.tsx");

    expect(navigation).toContain("lg:hidden");
    expect(navigation).toContain("hidden xl:inline");
    expect(layout).toContain("lg:pb-0");
  });

  it("keeps capture and tune-up inside the responsive Tasks workspace", () => {
    const tasks = read("src/app/(common)/tasks/page.tsx");
    const capture = read("src/components/tasks/TaskCaptureWorkspace.tsx");

    expect(tasks).toContain('"brain-dump"');
    expect(tasks).toContain('"tune-up"');
    expect(tasks).not.toContain("BoardView");
    expect(capture).toContain("overflow-x-clip");
  });

  it("uses edge arrows for every collapsible left panel", () => {
    const calendar = read("src/components/calendar/Calendar.tsx");
    const projects = read("src/components/projects/ProjectSidebar.tsx");
    const focus = read("src/components/focus/FocusMode.tsx");

    expect(calendar).not.toContain("HiMenu");
    expect(calendar).toContain("Open calendar sidebar");
    expect(projects).toContain("Open projects sidebar");
    expect(focus).toContain("Open focus task queue");
    expect(calendar).toContain("rounded-r-xl border border-l-0");
    expect(projects).toContain("rounded-r-xl border border-l-0");
    expect(focus).toContain("md:rounded-r-xl md:border-l-0");
    expect(calendar).toContain("xl:left-[319px]");
    expect(calendar).toContain("z-[70]");
    expect(projects).toContain("setIsSidebarOpen((current) => !current)");
    expect(projects).toContain("-right-[27px]");
  });

  it("reserves layout space and an opaque surface for an open project panel", () => {
    const projects = read("src/components/projects/ProjectSidebar.tsx");
    expect(projects).toContain('isSidebarOpen ? "w-64" : "w-10"');
    expect(projects).toContain("bg-card");
    expect(projects).toContain("New project");
    expect(projects).not.toContain('isSidebarOpen && "xl:w-64"');
  });

  it("wraps calendar controls before they can collide", () => {
    const calendar = read("src/components/calendar/Calendar.tsx");
    expect(calendar).toContain("md:flex-wrap");
    expect(calendar).toContain("2xl:w-auto");
    expect(calendar).toContain("min-w-0 flex-1 truncate");
    expect(calendar).toContain("md:hidden");
  });

  it("contains primary phone surfaces at narrow widths", () => {
    const surfaces = [
      "src/app/(common)/plan/page.tsx",
      "src/app/(common)/tasks/page.tsx",
      "src/components/tasks/TaskCaptureWorkspace.tsx",
      "src/app/(common)/friends/page.tsx",
      "src/app/(common)/settings/page.tsx",
      "src/components/focus/FocusMode.tsx",
    ].map(read);

    for (const surface of surfaces) {
      expect(surface).toContain("min-w-0");
      expect(surface).toContain("overflow-x-clip");
    }
    expect(surfaces[0]).toContain("min-[380px]:px-4");
    expect(surfaces[0]).toContain("max-w-full");
  });
});
