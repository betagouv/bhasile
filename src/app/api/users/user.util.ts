export const getUserRole = <TRole>(
  user: UserWithRoleSources<TRole>
): TRole | null => user.role ?? user.emailPattern?.role ?? null;

type UserWithRoleSources<TRole> = {
  role: TRole | null;
  emailPattern: { role: TRole } | null;
};
