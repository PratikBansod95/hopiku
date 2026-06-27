import "./style.css";
import { bootApplication } from "@app/Application";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootApplication();
  });
} else {
  void bootApplication();
}
