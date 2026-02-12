import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoleTabs } from "@/components/role-tabs";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("RoleTabs", () => {
  it("renders tabs based on active route role", () => {
    mockPathname = "/coach/workouts";
    const { rerender } = render(<RoleTabs />);
    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(screen.queryByText("Athlete")).not.toBeInTheDocument();

    mockPathname = "/athlete/dashboard";
    rerender(<RoleTabs />);
    expect(screen.getByText("Athlete")).toBeInTheDocument();
    expect(screen.queryByText("Coach")).not.toBeInTheDocument();
  });
});
