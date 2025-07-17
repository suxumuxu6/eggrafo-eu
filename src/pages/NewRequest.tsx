import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { saveChatToSupabase } from "@/utils/chatStorage";
import { generateSupportTicketCode } from "@/utils/ticketUtils";
import { ChatMessage } from "@/types/chat";

const NewRequest: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !requestType.trim() || !message.trim()) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email");
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedTicketCode = generateSupportTicketCode();
      
      // Create chat messages to simulate the conversation
      const chatMessages: ChatMessage[] = [
        { sender: "bot", text: "Νέο αίτημα από φόρμα:" },
        { sender: "user", text: `Όνομα: ${name}` },
        { sender: "user", text: `Θα ήθελα: ${requestType}` },
        { sender: "user", text: legalForm ? `Νομική Μορφή: ${legalForm}` : "" },
        { sender: "user", text: `Μήνυμα: ${message}` },
        { sender: "user", text: email },
        { 
          sender: "bot", 
          text: `✅ Το αίτημά σας έχει καταχωρηθεί με επιτυχία!

📧 ΟΔΗΓΙΕΣ ΠΡΟΣΒΑΣΗΣ:

1️⃣ Επισκεφτείτε τη σελίδα υποστήριξης: 
   https://eggrafo.work/support

2️⃣ Εισάγετε τα στοιχεία σας:
   • Email: ${email}
   • Κωδικός: ${generatedTicketCode}

3️⃣ Θα μπορείτε να:
   ✓ Δείτε την πρόοδο του αιτήματός σας
   ✓ Λάβετε απαντήσεις από την ομάδα μας
   ✓ Στείλετε επιπλέον μηνύματα

🔔 Θα λάβετε ειδοποίηση στο email σας με αυτές τις οδηγίες και όταν υπάρχει νέα απάντηση από την ομάδα υποστήριξης.

Ευχαριστούμε για την επικοινωνία!`
        }
      ];

      const success = await saveChatToSupabase(chatMessages, email, generatedTicketCode);
      
      if (success) {
        setTicketCode(generatedTicketCode);
        setIsSubmitted(true);
        toast.success("Το αίτημά σας εστάλη με επιτυχία");
      } else {
        throw new Error("Failed to save request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Υπήρξε πρόβλημα κατά την αποστολή του αιτήματος");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setRequestType("");
    setLegalForm("");
    setMessage("");
    setTicketCode("");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Το αίτημά σας εστάλη με επιτυχία!
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Κωδικός Αιτήματος:</strong>
                </p>
                <p className="text-lg font-mono font-bold text-blue-900">
                  {ticketCode}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Μπορείτε να παρακολουθήσετε την πρόοδο του αιτήματός σας στη σελίδα Support 
                χρησιμοποιώντας το email και τον κωδικό σας.
              </p>
              <div className="space-y-3">
                <Button onClick={handleNewRequest} variant="outline" className="w-full">
                  Νέο Αίτημα
                </Button>
                <Button onClick={() => window.location.href = '/support'} className="w-full">
                  Μετάβαση στο Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Νέο Αίτημα Υποστήριξης</CardTitle>
            <CardDescription>
              Συμπληρώστε τη φόρμα παρακάτω για να στείλετε ένα νέο αίτημα υποστήριξης
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Όνομα *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Το όνομά σας"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requestType">Θα ήθελα: *</Label>
                <Select value={requestType} onValueChange={setRequestType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε τι θα θέλατε" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-document">Νέο Υπόδειγμα έγγραφου ΓΕΜΗ</SelectItem>
                    <SelectItem value="gemi-process">Διαδικασία στο ΓΕΜΗ</SelectItem>
                    <SelectItem value="technical-issue">Τεχνικό Θέμα με την λήψη αρχείου</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="legalForm">Επιλέξτε Νομική Μορφή:</Label>
                <Select value={legalForm} onValueChange={setLegalForm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε νομική μορφή (προαιρετικό)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oe-ee">ΟΕ-ΕΕ</SelectItem>
                    <SelectItem value="ae">ΑΕ</SelectItem>
                    <SelectItem value="ike">ΙΚΕ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Μήνυμα *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Περιγράψτε λεπτομερώς το αίτημά σας..."
                  rows={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Αποστολή...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Αποστολή Αιτήματος
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewRequest;