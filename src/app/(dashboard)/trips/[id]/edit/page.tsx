import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditTripForm from "@/components/trips/edit-trip-form";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      members: true,
    },
  });

  if (!trip) notFound();

  // Check admin
  const isAdmin = trip.members.some(
    (m) => m.userId === userId && m.role === "ADMIN"
  );
  if (!isAdmin) redirect(`/trips/${id}`);

  const tripData = JSON.parse(JSON.stringify(trip));

  return <EditTripForm trip={tripData} />;
}
