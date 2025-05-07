import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminUsers } from "@/hooks/use-admin";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Search, Users, Loader2, UserCog, Edit, Ban, Mailbox } from "lucide-react";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showingDetails, setShowingDetails] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const { users, totalUsers, totalPages, isLoading } = useAdminUsers(page);
  
  // Mutation for updating user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User role updated",
        description: "The user's role has been updated successfully."
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user role",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Function to handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality once API is ready
    toast({
      title: "Search functionality",
      description: "User search will be implemented in a future update."
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#002D5C]">User Management</h1>
            <div className="flex items-center">
              <form onSubmit={handleSearch} className="relative mr-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
              <Button type="submit" className="bg-[#002D5C]">
                Search
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#002D5C]" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-gray-500">No user accounts have been created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-[#002D5C] text-white flex items-center justify-center mr-3">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.username}</div>
                                <div className="text-xs text-gray-500 mt-0.5">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {user.email}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant="outline"
                              className={`
                                ${user.role === 'admin' ? 'border-purple-500 text-purple-600 bg-purple-50' : 
                                  'border-gray-300 text-gray-700 bg-gray-50'}
                              `}
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowingDetails(user)}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Action not available",
                                    description: "User suspension will be implemented in a future update."
                                  });
                                }}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* User Details Dialog */}
      <Dialog open={!!showingDetails} onOpenChange={(open) => !open && setShowingDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user account
            </DialogDescription>
          </DialogHeader>
          
          {showingDetails && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-[#002D5C] text-white flex items-center justify-center text-2xl">
                  {showingDetails.username.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="mt-1">{showingDetails.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{showingDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="mt-1">{showingDetails.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <p className="mt-1">{formatDate(showingDetails.createdAt)}</p>
                </div>
                {showingDetails.firstName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">First Name</p>
                    <p className="mt-1">{showingDetails.firstName}</p>
                  </div>
                )}
                {showingDetails.lastName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Name</p>
                    <p className="mt-1">{showingDetails.lastName}</p>
                  </div>
                )}
                {showingDetails.phoneNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{showingDetails.phoneNumber}</p>
                  </div>
                )}
                {showingDetails.country && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Country</p>
                    <p className="mt-1">{showingDetails.country}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Feature coming soon",
                        description: "Email functionality will be implemented in a future update."
                      });
                    }}
                  >
                    <Mailbox className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button 
                    className="w-full bg-[#002D5C]"
                    onClick={() => {
                      setShowingDetails(null);
                      setEditingUser(showingDetails);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and permissions
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#002D5C] text-white flex items-center justify-center mr-3">
                  {editingUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{editingUser.username}</div>
                  <div className="text-sm text-gray-500">{editingUser.email}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Role</label>
                  <Select
                    defaultValue={editingUser.role}
                    onValueChange={(value) => {
                      updateUserRole.mutate({
                        userId: editingUser.id,
                        role: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {editingUser.role === 'admin' 
                      ? "Admin users have full access to the admin dashboard and all management functions."
                      : "Regular users can enter competitions but cannot access admin features."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#002D5C]"
              onClick={() => setEditingUser(null)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
