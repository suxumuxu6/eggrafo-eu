
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserSupportSearchProps {
  email: string;
  setEmail: (email: string) => void;
  ticketCode: string;
  setTicketCode: (code: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const UserSupportSearch: React.FC<UserSupportSearchProps> = ({
  email,
  setEmail,
  ticketCode,
  setTicketCode,
  onSearch,
  isLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Υποστήριξη Χρηστών</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Εισάγετε το email σας"
            />
          </div>
          <div>
            <Label htmlFor="ticketCode">Κωδικός Αιτήματος</Label>
            <Input
              id="ticketCode"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              placeholder="Εισάγετε τον κωδικό"
            />
          </div>
        </div>
        
        <Button 
          onClick={onSearch} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Αναζήτηση..." : "Αναζήτηση Συνομιλίας"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserSupportSearch;
