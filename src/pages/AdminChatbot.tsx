
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface ChatbotMessage {
  id: string;
  email: string | null;
  messages: Array<{ sender: "user" | "bot"; text: string }>;
  submitted_at: string;
}

const AdminChatbot: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (!error && data) setData(data as ChatbotMessage[]);
      setLoading(false);
    }
    fetchMessages();
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-400">Admin access only</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Chatbot Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full flex justify-center items-center py-24">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No chatbot submissions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <TableRow>
                      <TableCell>{msg.email || <span className="text-gray-400">None</span>}</TableCell>
                      <TableCell>
                        {msg.submitted_at
                          ? new Date(msg.submitted_at).toLocaleString()
                          : ""}
                      </TableCell>
                      <TableCell>
                        <button
                          className="underline text-blue-600"
                          onClick={() =>
                            setExpandedId(expandedId === msg.id ? null : msg.id)
                          }
                        >
                          {expandedId === msg.id ? "Hide" : "Show"}
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedId === msg.id && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <div className="space-y-1">
                            {msg.messages.map((m, i) => (
                              <div key={i}>
                                <span className="font-semibold">{m.sender === "user" ? "User" : "Bot"}:</span>{" "}
                                <span>{m.text}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminChatbot;
