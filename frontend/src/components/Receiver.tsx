import { useEffect, useRef, useState } from "react";

export function Receiver() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setSocket(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      let pc: any = null;
      if (message.type == "createOffer") {
        pc = new RTCPeerConnection();
        pc.setRemoteDescription(message.sdp);

        pc.onicecandidate = (event: any) => {
          console.log(event);
          if (event.candidate) {
            socket?.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
              })
            );
          }
        };
        pc.ontrack = (track: any) => {
          //   console.log(track);
          //   if (videoRef.current) {
          //      videoRef.current.srcObject = new MediaStream([track.track]);
          //      video.play()
          //   }

          const video = document.createElement("video");
          document.body.appendChild(video);
          video.srcObject = new MediaStream([track.track]);
          video.play();
        };
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.send(
          JSON.stringify({
            type: "createAnswer",
            sdp: pc.localDescription,
          })
        );
      } else if (event.type == "iceCandidate") {
        if (!pc) return;
        pc.addIceCandidate(message.candidate);
      }
    };
  }, []);
  return (
    <div>
      Receiver
      <video ref={videoRef}></video>
    </div>
  );
}
