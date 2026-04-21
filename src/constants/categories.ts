import { Search, Info, MapPin, Zap, Flame, Calendar, Wrench, ShieldAlert, Utensils, BookOpen, Trophy, Car, Building, DollarSign, Users } from 'lucide-react';

export const ALERT_CATEGORIES = {
  LOST_ITEM: { displayName: "Lost & Found", colorClass: "bg-cat-lost", textClass: "text-cat-lost", icon: Search },
  CLASS_CANCELLED: { displayName: "Class Cancelled", colorClass: "bg-cat-class", textClass: "text-cat-class", icon: ShieldAlert },
  EVENT: { displayName: "Campus Event", colorClass: "bg-cat-event", textClass: "text-cat-event", icon: Calendar },
  EMERGENCY: { displayName: "Emergency", colorClass: "bg-cat-emergency", textClass: "text-cat-emergency", icon: Zap },
  FREE_FOOD: { displayName: "Free Food!", colorClass: "bg-cat-food", textClass: "text-cat-food", icon: Utensils },
  ACADEMIC: { displayName: "Academic", colorClass: "bg-cat-academic", textClass: "text-cat-academic", icon: BookOpen },
  SPORTS: { displayName: "Sports & Fest", colorClass: "bg-cat-sports", textClass: "text-cat-sports", icon: Trophy },
  MAINTENANCE: { displayName: "Maintenance", colorClass: "bg-cat-maintenance", textClass: "text-cat-maintenance", icon: Wrench },
  RANT: { displayName: "Campus Rant", colorClass: "bg-cat-rant", textClass: "text-cat-rant", icon: Flame },
  PARKING: { displayName: "Parking", colorClass: "bg-cat-lost", textClass: "text-cat-lost", icon: Car },
  HOUSING: { displayName: "Housing", colorClass: "bg-cat-academic", textClass: "text-cat-academic", icon: Building },
  BUY_SELL: { displayName: "Buy/Sell", colorClass: "bg-cat-food", textClass: "text-cat-food", icon: DollarSign },
  STUDY_GROUP: { displayName: "Study Group", colorClass: "bg-cat-event", textClass: "text-cat-event", icon: Users },
  GENERAL: { displayName: "General", colorClass: "bg-cat-general", textClass: "text-cat-general", icon: Info },
};

export type CategoryKey = keyof typeof ALERT_CATEGORIES;
