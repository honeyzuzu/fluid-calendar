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

  it("uses fluid board columns without fixed-width horizontal clipping", () => {
    const board = read("src/components/tasks/BoardView/BoardView.tsx");
    const column = read("src/components/tasks/BoardView/Column.tsx");

    expect(board).toContain("md:grid-cols-3");
    expect(board).toContain("overflow-x-hidden");
    expect(column).toContain("min-w-0 w-full");
    expect(column).not.toContain("w-[85vw]");
  });

  it("uses edge arrows for every collapsible left panel", () => {
    const calendar = read("src/components/calendar/Calendar.tsx");
    const projects = read("src/components/projects/ProjectSidebar.tsx");
    const focus = read("src/components/focus/FocusMode.tsx");

    expect(calendar).not.toContain("HiMenu");
    expect(calendar).toContain("Open calendar sidebar");
    expect(projects).toContain("Open projects sidebar");
    expect(focus).toContain("Open focus task queue");
  });
});
