import React, { useContext } from "react";
import { AppContent } from "../context/AppContext";

const Header = () => {
  const { userData } = useContext(AppContent);
  console.log(userData);
  return (
    <div>
      Hey, {userData?.name || "Guest"} <br />
      Welcome to kalakriti
      <button type="button">Gets Started</button>
    </div>
  );
};

export default Header;