import React from "react";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0" }}>
      <Link to="/" style={{ marginRight: "1rem" }}>Articles</Link>
      <Link to="/scraping">Scraping</Link>
    </nav>
  );
}

export default NavBar;
