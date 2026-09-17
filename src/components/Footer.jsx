import { APP_VERSION } from "../constants/versions.js";

function Footer() {
  return (
    <footer className="site-footer">
      <p>&copy; {new Date().getFullYear()} Wine Words</p>
      <p className="site-footer__version">Version {APP_VERSION}</p>
    </footer>
  );
}

export default Footer;
