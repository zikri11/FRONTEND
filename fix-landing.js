import fs from 'fs';
import path from 'path';

const landingDir = path.join(process.cwd(), 'src', 'components', 'landing');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace next/image
  content = content.replace(/import Image.*from\s+["']next\/image["'];?\n?/g, '');
  content = content.replace(/import type \{ StaticImageData \} from ["']next\/image["'];?\n?/g, '');
  content = content.replace(/import \{ StaticImageData \} from ["']next\/image["'];?\n?/g, '');

  // Replace Next.js Image tag with standard img
  content = content.replace(/<Image\b/g, '<img');

  // Replace Next.js Link with Tanstack Router Link
  content = content.replace(/import Link from ["']next\/link["'];?/g, 'import { Link } from "@tanstack/react-router";');
  
  // Replace href= with to= for Link components
  // Need to be careful to only replace href on Link tags, but for simplicity we can replace it on all Links.
  // A regex that matches <Link ... href=
  content = content.replace(/(<Link[^>]+)href=/g, '$1to=');

  // Replace image imports with string constants
  // e.g., import BlurredShape from "@/public/images/blurred-shape.svg";
  // -> const BlurredShape = "/images/blurred-shape.svg";
  content = content.replace(/import\s+(\w+)\s+from\s+["']@\/public\/(images\/[^"']+)["'];?/g, 'const $1 = "/$2";');

  // Replace component imports pointing to @/components/
  // e.g., import ModalVideo from "@/components/modal-video";
  // -> import ModalVideo from "@/components/landing/modal-video";
  content = content.replace(/from\s+["']@\/components\/(?!landing\/)([^"']+)["']/g, 'from "@/components/landing/$1"');

  // For testimonials.tsx, there's `src={ClientImg01}` which for <img> needs to just be the string.
  // Since we replaced the import with `const ClientImg01 = "/images/..."`, `src={ClientImg01}` works perfectly!
  
  // Remove "priority" or "placeholder" attributes from img tags
  // We can just strip them if they exist
  content = content.replace(/priority(={[^}]+})?/g, '');
  content = content.replace(/placeholder=["'][^"']+["']/g, '');

  fs.writeFileSync(filePath, content, 'utf-8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(landingDir);
console.log('Done fixing Next.js components for Vite!');
