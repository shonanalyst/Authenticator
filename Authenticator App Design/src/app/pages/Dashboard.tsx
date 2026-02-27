import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Search, Copy, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  issuer: string;
  code: string;
  color: string;
  icon: string;
}

// Mock data with different services
const mockAccounts: Account[] = [
  {
    id: "1",
    name: "work@email.com",
    issuer: "Google",
    code: "123456",
    color: "#4285F4",
    icon: "https://www.google.com/favicon.ico",
  },
  {
    id: "2",
    name: "username",
    issuer: "GitHub",
    code: "789012",
    color: "#24292e",
    icon: "https://github.com/favicon.ico",
  },
  {
    id: "3",
    name: "personal@email.com",
    issuer: "Microsoft",
    code: "345678",
    color: "#00A4EF",
    icon: "https://www.microsoft.com/favicon.ico",
  },
  {
    id: "4",
    name: "user@company.com",
    issuer: "Slack",
    code: "901234",
    color: "#4A154B",
    icon: "https://slack.com/favicon.ico",
  },
  {
    id: "5",
    name: "myaccount",
    issuer: "Dropbox",
    code: "567890",
    color: "#0061FF",
    icon: "https://www.dropbox.com/favicon.ico",
  },
  {
    id: "6",
    name: "user123",
    issuer: "Discord",
    code: "234567",
    color: "#5865F2",
    icon: "https://discord.com/favicon.ico",
  },
];

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Load accounts from localStorage or use mock data
    const savedAccounts = localStorage.getItem("auth_accounts");
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      setAccounts(mockAccounts);
      localStorage.setItem("auth_accounts", JSON.stringify(mockAccounts));
    }
  }, []);

  useEffect(() => {
    // Timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Regenerate codes
          const newAccounts = accounts.map((account) => ({
            ...account,
            code: Math.floor(100000 + Math.random() * 900000).toString(),
          }));
          setAccounts(newAccounts);
          localStorage.setItem("auth_accounts", JSON.stringify(newAccounts));
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [accounts]);

  const filteredAccounts = accounts.filter(
    (account) =>
      account.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success("Code copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      // Fallback for when clipboard API is not available
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedId(id);
        toast.success("Code copied!");
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        toast.error("Failed to copy");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.get("name") as string,
      issuer: formData.get("issuer") as string,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      color: formData.get("color") as string || "#6366f1",
      icon: "",
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem("auth_accounts", JSON.stringify(updatedAccounts));
    setIsDialogOpen(false);
    toast.success("Account added!");
    e.currentTarget.reset();
  };

  const progress = (timeLeft / 30) * 100;

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Authenticator</h1>
            <p className="text-sm text-gray-600 mt-1">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-12 w-12 p-0">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Add Account</DialogTitle>
                <DialogDescription>
                  Enter your 2FA account details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issuer">Service Name</Label>
                  <Input
                    id="issuer"
                    name="issuer"
                    placeholder="e.g., Google, GitHub"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., username or email"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Theme Color</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue="#6366f1"
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Add Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-gray-50 border-0"
          />
        </div>
      </div>

      {/* Timer Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Refreshing in
          </span>
          <span className="text-lg font-bold text-gray-900">
            {timeLeft}s
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-4 py-4">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No accounts found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleCopy(account.code, account.id)}
                className="relative rounded-3xl shadow-lg overflow-hidden active:scale-[0.98] transition-transform"
                style={{ backgroundColor: account.color }}
              >
                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md bg-black/20 backdrop-blur-sm"
                      >
                        {account.issuer.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base drop-shadow-sm">
                          {account.issuer}
                        </h3>
                        <p className="text-sm text-white/80">{account.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {copiedId === account.id ? (
                        <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Copy className="h-6 w-6 text-white/70" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-4xl font-bold tracking-wider text-center py-3 text-white drop-shadow-sm">
                    {account.code.slice(0, 3)}{" "}
                    <span className="text-white/60">{account.code.slice(3)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}