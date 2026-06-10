import { Layout } from "@/components/layout";
import { useGetMe, useAdminListInstructors, useAdminListUsers, useAdminListPendingReviews, useAdminModerateReview, useAdminCreateInstructor, useAdminDeleteInstructor, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { data: user } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const [tab, setTab] = useState<"instructors" | "reviews" | "users">("instructors");

  if (!user?.isAdmin) {
    return <Layout><div className="py-20 text-center text-xl font-bold">Unauthorized.</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-4xl font-black tracking-tighter text-destructive">Admin Console</h1>
        
        <div className="flex space-x-1 border-b">
          <button 
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${tab === "instructors" ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("instructors")}
          >
            Instructors
          </button>
          <button 
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${tab === "reviews" ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("reviews")}
          >
            Moderation Queue
          </button>
          <button 
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${tab === "users" ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
        </div>

        <div>
          {tab === "instructors" && <AdminInstructors />}
          {tab === "reviews" && <AdminReviews />}
          {tab === "users" && <AdminUsers />}
        </div>
      </div>
    </Layout>
  );
}

function AdminInstructors() {
  const { data: instructors, refetch } = useAdminListInstructors();
  const createInstructor = useAdminCreateInstructor();
  const deleteInstructor = useAdminDeleteInstructor();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createInstructor.mutate({ data: { name, specialty } }, {
      onSuccess: () => {
        setName("");
        setSpecialty("");
        refetch();
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteInstructor.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="space-y-8">
      <div className="border p-6 bg-card">
        <h3 className="font-bold mb-4">Add Instructor</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input className="flex-1 p-2 border bg-background" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="flex-1 p-2 border bg-background" placeholder="Specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} required />
          <button type="submit" className="bg-primary text-primary-foreground px-6 font-bold" disabled={createInstructor.isPending}>Add</button>
        </form>
      </div>

      <div className="border rounded bg-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-sm font-bold">ID</th>
              <th className="p-3 text-sm font-bold">Name</th>
              <th className="p-3 text-sm font-bold">Specialty</th>
              <th className="p-3 text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {instructors?.map(inst => (
              <tr key={inst.id}>
                <td className="p-3 text-sm">{inst.id}</td>
                <td className="p-3 font-medium">{inst.name}</td>
                <td className="p-3 text-muted-foreground">{inst.specialty}</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(inst.id)} className="text-destructive font-bold text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReviews() {
  const { data: reviews, refetch } = useAdminListPendingReviews();
  const moderate = useAdminModerateReview();

  const handleModerate = (id: number, status: "approved" | "rejected") => {
    moderate.mutate({ reviewId: id, data: { status } }, { onSuccess: () => refetch() });
  };

  if (!reviews?.length) return <div className="p-10 border bg-card text-center text-muted-foreground">Queue is empty.</div>;

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="border p-4 bg-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold">{review.instructorName}</div>
              <div className="text-sm text-muted-foreground">by {review.userName}</div>
            </div>
            <div className="text-xl font-black text-accent">{review.overallScore.toFixed(1)}</div>
          </div>
          <p className="mb-4">{review.comment}</p>
          <div className="flex gap-2">
            <button onClick={() => handleModerate(review.id, "approved")} className="bg-green-600 text-white px-4 py-1 rounded font-bold text-sm">Approve</button>
            <button onClick={() => handleModerate(review.id, "rejected")} className="bg-red-600 text-white px-4 py-1 rounded font-bold text-sm">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminUsers() {
  const { data: users } = useAdminListUsers();

  return (
    <div className="border rounded bg-card overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-sm font-bold">ID</th>
            <th className="p-3 text-sm font-bold">Name</th>
            <th className="p-3 text-sm font-bold">Email</th>
            <th className="p-3 text-sm font-bold">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users?.map(user => (
            <tr key={user.id}>
              <td className="p-3 text-sm">{user.id}</td>
              <td className="p-3 font-medium">{user.name}</td>
              <td className="p-3 text-muted-foreground">{user.email}</td>
              <td className="p-3 text-xs font-bold uppercase">{user.isAdmin ? <span className="text-destructive">Admin</span> : 'User'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
