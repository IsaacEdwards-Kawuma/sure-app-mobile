import { create } from 'zustand';

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;

interface SidebarState {
  collapsed: boolean;
  open: boolean; // for mobile overlay
  widthExpanded: number;
  widthCollapsed: number;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  open: false,
  widthExpanded: SIDEBAR_WIDTH_EXPANDED,
  widthCollapsed: SIDEBAR_WIDTH_COLLAPSED,
  toggle: (overlayMode?: boolean) =>
    set((s) =>
      overlayMode ? { open: !s.open, collapsed: false } : { collapsed: !s.collapsed }
    ),
  setOpen: (open) => set({ open }),
}));

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };
