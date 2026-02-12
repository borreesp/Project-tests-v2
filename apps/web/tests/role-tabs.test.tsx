import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoleTabs } from '@/components/role-tabs';

describe('RoleTabs', () => {
  it('renders role labels for coach and athlete', () => {
    render(<RoleTabs role="COACH" />);

    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText('Atleta')).toBeInTheDocument();
  });
});
