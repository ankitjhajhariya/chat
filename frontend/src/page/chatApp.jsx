import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

function Chat() {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState("");
    const messagesEndRef = useRef(null);
    const didPrompt = useRef(false);

    useEffect(() => {
        let name = "";
        while (!name) {
            name = prompt("Enter your name:");
        }
        setUsername(name);
        didPrompt.current = true;
    }, []);

    useEffect(() => {
        socket.on("chat message", (msg) => {
            // Update own sent message to delivered OR add new incoming message
            setMessages((prev) => {
                const exists = prev.find((m) => m.id === msg.id);
                if (exists) {
                    return prev.map((m) =>
                        m.id === msg.id ? { ...m, status: "delivered" } : m
                    );
                } else {
                    return [...prev, { ...msg, status: "delivered" }];
                }
            });
        });

        socket.on("typing", (user) => {
            setTypingUser(user);
            setTimeout(() => setTypingUser(""), 2000);
        });

        socket.on("seen", (msgId) => {
            setMessages((prev) =>
                prev.map((m) => (m.id === msgId ? { ...m, status: "seen" } : m))
            );
        });

        return () => {
            socket.off("chat message");
            socket.off("typing");
            socket.off("seen");
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.user !== username && lastMsg.status !== "seen") {
                socket.emit("seen", lastMsg.id);
            }
        }
    }, [messages, username]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
            const dateString = now.toLocaleDateString();
            const msgData = {
                id: Date.now(),
                user: username,
                text: message,
                time: timeString,
                date: dateString,
                status: "sent", // ✅ Mark own message as sent
            };
            // Add your own message immediately
            setMessages((prev) => [...prev, msgData]);
            socket.emit("chat message", msgData);
            setMessage("");
        }
    };

    const handleTyping = () => {
        socket.emit("typing", username);
    };

    const getTick = (status) => {
        if (status === "sent") return "✔";
        if (status === "delivered") return "✔✔";
        if (status === "seen") return "✔✔";
        return "";
    };

    return (
        <div className="container py-3" style={{ maxWidth: "600px" }}>
            <div
                className="border rounded d-flex flex-column"
                style={{ height: "80vh" }}
            >
                {/* Header */}
                <div className="bg-success text-white p-3">
                    <h5 className="mb-0">💬 Chat</h5>
                    {typingUser && typingUser !== username && (
                        <small>{typingUser} is typing...</small>
                    )}
                </div>

                {/* Chat Body */}
                <div
                    className="flex-grow-1 overflow-auto p-3 d-flex flex-column"
                    style={{ backgroundColor: "#ece5dd" }}
                >
                    {messages.map((msg) => {
                        const isMe = msg.user === username;
                        return (
                            <div
                                key={msg.id}
                                className={`d-flex mb-2 ${isMe ? "justify-content-end" : "justify-content-start"
                                    }`}
                            >
                                <div
                                    className="p-2 rounded shadow-sm"
                                    style={{
                                        backgroundColor: isMe ? "#dcf8c6" : "#ffffff",
                                        maxWidth: "70%",
                                    }}
                                >
                                    <small className="fw-bold">{msg.user}</small>
                                    <div>{msg.text}</div>
                                    <div className="text-end">
                                        <small className="text-muted">
                                            {msg.date} {msg.time}{" "}
                                            {isMe && (
                                                <span
                                                    style={{
                                                        color: msg.status === "seen" ? "blue" : "gray",
                                                    }}
                                                >
                                                    {getTick(msg.status)}
                                                </span>
                                            )}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={sendMessage}
                    className="d-flex p-2 border-top bg-light"
                >
                    <input
                        type="text"
                        className="form-control me-2"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleTyping}
                    />
                    <button className="btn btn-success" type="submit">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Chat;
