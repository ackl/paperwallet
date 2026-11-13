import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import { render } from "preact";
import { App } from "./app";
import "./styles.css";

render(<App />, document.getElementById("app")!);
