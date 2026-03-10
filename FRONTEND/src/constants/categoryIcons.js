// src/constants/categoryIcons.js
import { 
  Laptop, Smartphone, Package, Home, Shirt, BookOpen, 
  Gamepad2, Camera, Watch, Coffee, Dumbbell, Music, 
  Palette, Car, Sparkles, Heart, Gift, Percent 
} from 'lucide-react';
import React from 'react';

export const categoryIcons = {
  electronics: React.createElement(Laptop, { className: "w-5 h-5" }),
  smartphones: React.createElement(Smartphone, { className: "w-5 h-5" }),
  computers: React.createElement(Laptop, { className: "w-5 h-5" }),
  gaming: React.createElement(Gamepad2, { className: "w-5 h-5" }),
  cameras: React.createElement(Camera, { className: "w-5 h-5" }),
  fashion: React.createElement(Shirt, { className: "w-5 h-5" }),
  clothing: React.createElement(Shirt, { className: "w-5 h-5" }),
  shoes: React.createElement(Watch, { className: "w-5 h-5" }),
  accessories: React.createElement(Watch, { className: "w-5 h-5" }),
  home: React.createElement(Home, { className: "w-5 h-5" }),
  furniture: React.createElement(Home, { className: "w-5 h-5" }),
  kitchen: React.createElement(Coffee, { className: "w-5 h-5" }),
  books: React.createElement(BookOpen, { className: "w-5 h-5" }),
  textbooks: React.createElement(BookOpen, { className: "w-5 h-5" }),
  sports: React.createElement(Dumbbell, { className: "w-5 h-5" }),
  fitness: React.createElement(Dumbbell, { className: "w-5 h-5" }),
  automotive: React.createElement(Car, { className: "w-5 h-5" }),
  toys: React.createElement(Gamepad2, { className: "w-5 h-5" }),
  music: React.createElement(Music, { className: "w-5 h-5" }),
  art: React.createElement(Palette, { className: "w-5 h-5" }),
  beauty: React.createElement(Sparkles, { className: "w-5 h-5" }),
  health: React.createElement(Heart, { className: "w-5 h-5" }),
  gifts: React.createElement(Gift, { className: "w-5 h-5" }),
  deals: React.createElement(Percent, { className: "w-5 h-5" }),
  default: React.createElement(Package, { className: "w-5 h-5" })
};