
import React from "react";
import UserSupportSearch from "@/components/support/UserSupportSearch";
import ConversationDisplay from "@/components/support/ConversationDisplay";
import RepliesSection from "@/components/support/RepliesSection";
import ReplyForm from "@/components/support/ReplyForm";
import { useUserSupportData } from "@/hooks/useUserSupportData";

const UserSupport: React.FC = () => {
  const {
    email,
    setEmail,
    ticketCode,
    setTicketCode,
    conversation,
    replies,
    newReply,
    setNewReply,
    isLoading,
    conversationFound,
    uploadedFile,
    setUploadedFile,
    handleSearch,
    handleSendReply
  } = useUserSupportData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <UserSupportSearch
        email={email}
        setEmail={setEmail}
        ticketCode={ticketCode}
        setTicketCode={setTicketCode}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {conversationFound && (
        <div className="mt-6 space-y-4">
          <ConversationDisplay conversation={conversation} />
          <RepliesSection replies={replies} />
          <ReplyForm
            newReply={newReply}
            setNewReply={setNewReply}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            onSendReply={handleSendReply}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default UserSupport;
