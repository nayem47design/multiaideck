// Screen tokens for Projects: the project page (Project · MultiAI launch; the other two project
// frames are the same layout) and the New project dialog (Overlay · New project).
// TS(name, kind, [screen, ...layer names], prop): see scripts/screen-tokens/README.md.

const PAGE = "Project · MultiAI launch";
const NEW = "Overlay · New project";
const FIELD = "Field · Project name";

const projects = (TS) => [
  // ---- Project page head: folder icon + name
  TS("project-title-gap", "size", [PAGE, "Main", "Head", "Title"], "gap"),
  TS(
    "project-title-icon",
    "size",
    [PAGE, "Main", "Head", "Title", "Icon/folder"],
    "w",
  ),

  // ---- New project dialog
  TS("new-project-width", "size", [NEW], "w"),
  TS("new-project-pad", "size", [NEW], "padX"),
  TS("new-project-gap", "size", [NEW], "gap"),
  TS("new-project", "radius", [NEW], "radius"),
  TS("new-project-title", "text", [NEW, "Sign out of MultiAI?"]),
  TS("new-project-field-gap", "size", [NEW, FIELD], "gap"),
  TS("new-project-input-h", "size", [NEW, FIELD, "Input"], "h"),
  TS("new-project-input-pad", "size", [NEW, FIELD, "Input"], "padX"),
  TS("new-project-input", "radius", [NEW, FIELD, "Input"], "radius"),
  TS(
    "new-project-input-stroke",
    "stroke",
    [NEW, FIELD, "Input"],
    "strokeWeight",
  ),
  TS("new-project-actions-gap", "size", [NEW, "Actions"], "gap"),
  TS("new-project-button-h", "size", [NEW, "Actions", "Button · Cancel"], "h"),
  TS(
    "new-project-button-pad",
    "size",
    [NEW, "Actions", "Button · Cancel"],
    "padX",
  ),
  TS("new-project-button", "text", [
    NEW,
    "Actions",
    "Button · Cancel",
    "Stay signed in",
  ]),
  TS(
    "new-project-button-icon",
    "size",
    [NEW, "Actions", "Button · Create project", "Icon/folder-add"],
    "w",
  ),
];

export default projects;
