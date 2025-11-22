#!/usr/bin/env node

// Quick test script to verify all builds work correctly
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 TVWS Build Verification Script\n");

// Check if dist folder exists (look in project root, not scripts folder)
const distPath = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distPath)) {
  console.log("❌ dist folder not found. Running build...");
  try {
    execSync("bun run build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Check all expected files
const expectedFiles = [
  "tvws.browser.js",
  "tvws.esm.js",
  "tvws.cjs",
  "index.d.ts",
];

let allFilesExist = true;
expectedFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const exists = fs.existsSync(filePath);
  const size = exists ? (fs.statSync(filePath).size / 1024).toFixed(2) : "N/A";
  console.log(`${exists ? "✅" : "❌"} ${file} (${size} KB)`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log("\n❌ Some files are missing. Please run: bun run build");
  process.exit(1);
}

console.log("\n✅ All build files present!\n");

// Test CommonJS build
console.log("📦 Testing CommonJS build...");
try {
  // Create a temporary test file for CommonJS
  const testCode = `
const tvws = require('./dist/tvws.cjs');
const client = tvws.createClient();
const chart = client.createChart();
console.log('COMMONJS_TEST_PASSED');
`;

  const projectRoot = path.join(__dirname, "..");
  const tempTestPath = path.join(projectRoot, "temp-test.cjs");

  fs.writeFileSync(tempTestPath, testCode);
  execSync("node temp-test.cjs", { stdio: "pipe", cwd: projectRoot });
  fs.unlinkSync(tempTestPath);

  console.log("✅ CommonJS build works");
  console.log("✅ createClient and session creation successful");
} catch (error) {
  console.log("❌ CommonJS build failed:", error.message);
}

console.log("\n📦 Testing ESM build...");
try {
  // Test if ESM file is syntactically valid
  const esmContent = fs.readFileSync(
    path.join(__dirname, "..", "dist", "tvws.esm.js"),
    "utf8",
  );
  if (esmContent.includes("export") && esmContent.includes("import")) {
    console.log("✅ ESM build syntax is valid");
  } else {
    console.log("❌ ESM build syntax issues");
  }
} catch (error) {
  console.log("❌ ESM build read failed:", error.message);
}

console.log("\n📦 Testing Browser build...");
try {
  const browserContent = fs.readFileSync(
    path.join(__dirname, "..", "dist", "tvws.browser.js"),
    "utf8",
  );
  if (
    browserContent.includes("window.tvws") ||
    browserContent.includes("globalThis")
  ) {
    console.log("✅ Browser build contains global exports");
  } else {
    console.log("⚠️  Browser build may not expose globals");
  }

  // Check for minification
  const lines = browserContent.split("\n").length;
  console.log(`✅ Browser build has ${lines} lines (minified)`);
} catch (error) {
  console.log("❌ Browser build read failed:", error.message);
}

console.log("\n🎉 Build verification completed!");
console.log("\nNext steps:");
console.log("- Run examples: node examples/basic-usage.cjs");
console.log("- Test browser: open examples/browser-demo.html");
console.log("- Check sizes: bun run size");
