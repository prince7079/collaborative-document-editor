import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";

const SAVE_INTERVAL_MS = 2000;

function App() {
  const wrapperRef = useRef();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;

    const documentId = "example-document-id"; // Replace with dynamic ID if needed
    socket.emit("get-document", documentId);

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket, quill]);

  useEffect(() => {
    const editor = document.createElement("div");
    wrapperRef.current.append(editor);
    const q = new Quill(editor, { theme: "snow" });
    q.disable();
    q.setText("Loading document...");
    setQuill(q);

    return () => {
      wrapperRef.current.innerHTML = "";
    };
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}

export default App;