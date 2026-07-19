/* Shared vocabulary used across the portal. These unions mirror the modifier
   classes in styles/tokens.css — adding a member here without adding the
   matching `fb-*--<name>` class will render unstyled. */

/** Semantic colour of a status indicator. `neutral` renders with no modifier class. */
export type Tone = "accent" | "danger" | "neutral" | "success" | "warning";

/** Every icon the set draws. `components/icons.tsx` is checked against this
    union, so adding a name here without a path there is a compile error. */
export type IconName =
  | "home" | "dashboard" | "wallet" | "book" | "bed" | "chart" | "calendar"
  | "bell" | "user" | "doc" | "help" | "logout" | "check" | "chevron"
  | "chevronDown" | "arrowRight" | "arrowLeft" | "plus" | "x" | "download"
  | "print" | "clock" | "shield" | "search" | "menu" | "sun" | "moon"
  | "building" | "cap" | "pin" | "mail" | "phone" | "lock" | "info" | "spark"
  | "bookOpen" | "heart" | "pill" | "flask" | "stethoscope" | "barcode"
  | "scan" | "layers" | "trash" | "edit" | "grid";

/** Tag colours. Omitting the variant yields the neutral tag. */
export type TagVariant = "accent" | "danger" | "success" | "warning";

/** Button styles — see `fb-btn--*` in tokens.css. */
export type BtnVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

/** Button sizes — see `fb-btn--sm` / `fb-btn--lg`. */
export type BtnSize = "sm" | "lg";

/** One sidebar link: the route key it navigates to, its label, and its icon. */
export type NavItem = [route: string, label: string, icon: IconName];

/** A titled group of sidebar links. */
export interface NavGroup {
  section: string;
  items: NavItem[];
}

/** A bell/notification entry. `id` and `time` are added when it lands in the store. */
export interface Notification {
  id: string;
  icon: IconName;
  tone?: Tone;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

/** A notification as authored by an action, before the store stamps id/time/unread. */
export type NotificationSeed = Omit<Notification, "id" | "time" | "unread">;
