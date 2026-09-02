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
    expect(projects).toContain('isSidebarOpen ? "w-64" : "w-6"');
    expect(projects).toContain("bg-[#fffdf2]");
    expect(projects).not.toContain('isSidebarOpen && "xl:w-64"');
  });

  it("wraps calendar controls before they can collide", () => {
    const calendar = read("src/components/calendar/Calendar.tsx");
    expect(calendar).toContain("md:flex-wrap");
    expect(calendar).toContain("2xl:w-auto");
    expect(calendar).toContain("min-w-0 flex-1 truncate");
    expect(calendar).toContain("md:hidden");
  });
});
