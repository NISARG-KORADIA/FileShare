import React, { useEffect } from "react";
import styles from "./Home.module.css";
import { v1 as uuid } from "uuid";

const Home = (props) => {
  function createRoom() {
    const id = uuid();
    props.history.push(`/room/${id}`);
  }

  return (
    <div>
      <button onClick={createRoom}>Create Room</button>
    </div>
  );
};

export default Home;
