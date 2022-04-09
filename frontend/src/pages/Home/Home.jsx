import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const Home = (props) => {
  const customIdGenerator = () => {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * 26));
    }
    return result;
  };

  return (
    <div>
      <Link
        to={{
          pathname: `/room/${customIdGenerator()}`,
          state: { isHost: true },
        }}
      >
        Create Room
      </Link>
    </div>
  );
};

export default Home;
