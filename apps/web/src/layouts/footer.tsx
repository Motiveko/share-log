import { Config } from "@web/config/env";

function Footer() {
  return (
    <footer className="flex justify-center items-center p-2">
      <p>© 2025 My {Config.SERVICE_NAME}</p>
    </footer>
  );
}

export default Footer;
