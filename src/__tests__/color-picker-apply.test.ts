import fs from "node:fs";
import path from "node:path";

describe("shared color picker apply flow", () => {
  const pickerSource = fs.readFileSync(
    path.join(
      process.cwd(),
      "src",
      "components",
      "calendar",
      "SunnieColorPicker.tsx"
    ),
    "utf8"
  );

  it("stages palette, recent, custom, and default choices", () => {
    expect(pickerSource).toContain(
      "onClick={() => stageColor(color.value, color.id)}"
    );
    expect(pickerSource).toContain("onClick={() => stageColor(color, null)}");
    expect(pickerSource).toContain("stageColor(color, null);");
    expect(pickerSource).toContain("onClick={() => stageColor(null, null)}");
  });

  it("waits for the consumer before treating the draft as applied", () => {
    expect(pickerSource).toContain(
      "await onChange(draftColor, draftColorSlot);"
    );
    expect(pickerSource).toContain('"Apply color"');
    expect(pickerSource).toContain("isApplying");
  });
});
