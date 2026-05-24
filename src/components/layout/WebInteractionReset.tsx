import { useEffect } from "react";
import { Platform } from "react-native";

const STYLE_ID = "nexo-web-interaction-reset";

const WEB_INTERACTION_RESET_CSS = `
html,
body,
#root {
  cursor: default;
}

body *:not(input):not(textarea):not([contenteditable="true"]):not([role="textbox"]) {
  caret-color: transparent;
  cursor: default;
  -webkit-user-select: none;
  user-select: none;
}

input,
textarea,
[contenteditable="true"],
[role="textbox"] {
  caret-color: auto;
  cursor: text;
  -webkit-user-select: text;
  user-select: text;
}

button,
button *,
a,
a *,
[role="button"],
[role="button"] * {
  cursor: pointer;
}

button:disabled,
button:disabled *,
[aria-disabled="true"],
[aria-disabled="true"] * {
  cursor: default;
}
`;

export function WebInteractionReset() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = WEB_INTERACTION_RESET_CSS;
    document.head.append(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
}
