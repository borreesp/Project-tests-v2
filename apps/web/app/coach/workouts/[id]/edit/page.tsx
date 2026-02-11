"use client";

import { useParams } from "next/navigation";

import { WorkoutBuilder } from "../../_components/workout-builder";

export default function EditCoachWorkoutPage() {
  const params = useParams<{ id: string }>();
  return <WorkoutBuilder mode="edit" workoutId={params.id} />;
}
