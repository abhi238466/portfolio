const readline = require("readline");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Admin = require("../src/models/Admin");
const { hashPassword } = require("../src/utils/password");

dotenv.config();

/*
|--------------------------------------------------------------------------
| Terminal Interface
|--------------------------------------------------------------------------
*/

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/*
|--------------------------------------------------------------------------
| Ask Question
|--------------------------------------------------------------------------
*/

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

/*
|--------------------------------------------------------------------------
| Ask Password
|--------------------------------------------------------------------------
|
| Password is entered through the terminal.
| It is never written inside this source file.
|
*/

const askPassword = () => {
  return new Promise((resolve) => {
    process.stdout.write("🔐 Enter admin password: ");

    let password = "";

    const stdin = process.stdin;

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (character) => {
      if (character === "\u0003") {
        cleanup();

        console.log("\n\n❌ Admin setup cancelled.");

        process.exit(0);
      }

      if (character === "\r" || character === "\n") {
        cleanup();

        process.stdout.write("\n");
        resolve(password);

        return;
      }

      if (character === "\u007f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
        }

        return;
      }

      password += character;
    };

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    stdin.on("data", onData);
  });
};

/*
|--------------------------------------------------------------------------
| Validate Email
|--------------------------------------------------------------------------
*/

const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

/*
|--------------------------------------------------------------------------
| Validate Password
|--------------------------------------------------------------------------
*/

const validatePassword = (password) => {
  if (!password) {
    return "Password cannot be empty.";
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Create Admin
|--------------------------------------------------------------------------
*/

const createAdmin = async () => {
  try {
    console.log("\n========================================");
    console.log("   Personal Career Portfolio");
    console.log("        Admin Setup 🔐");
    console.log("========================================\n");

    /*
    |--------------------------------------------------------------------------
    | Check MongoDB URI
    |--------------------------------------------------------------------------
    */

    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not configured in the .env file."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Collect Admin Information
    |--------------------------------------------------------------------------
    */

    const name = await askQuestion(
      "👤 Enter admin name: "
    );

    const email = await askQuestion(
      "📧 Enter admin email: "
    );

    const password = await askPassword();

    /*
    |--------------------------------------------------------------------------
    | Basic Validation
    |--------------------------------------------------------------------------
    */

    if (!name) {
      console.log("\n❌ Admin name cannot be empty.");
      return;
    }

    if (!email || !isValidEmail(email)) {
      console.log("\n❌ Please enter a valid email address.");
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      console.log(`\n❌ ${passwordError}`);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Connect MongoDB
    |--------------------------------------------------------------------------
    */

    console.log("\n🔄 Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connection successful.");

    /*
    |--------------------------------------------------------------------------
    | Normalize Email
    |--------------------------------------------------------------------------
    */

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Check Existing Admin
    |--------------------------------------------------------------------------
    */

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      console.log(
        "\n⚠️ An admin account with this email already exists."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    console.log("🔐 Securing admin password...");

    const hashedPassword = await hashPassword(password);

    /*
    |--------------------------------------------------------------------------
    | Create Admin Document
    |--------------------------------------------------------------------------
    */

    const admin = await Admin.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isActive: true,
      lastLoginAt: null,
    });

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    console.log("\n========================================");
    console.log("       ADMIN CREATED SUCCESSFULLY 🎉");
    console.log("========================================");
    console.log(`👤 Name  : ${admin.name}`);
    console.log(`📧 Email : ${admin.email}`);
    console.log(`🆔 ID    : ${admin._id}`);
    console.log("🔐 Password: Securely hashed");
    console.log("========================================\n");

    console.log(
      "✅ You can now use this account for Admin Login."
    );
  } catch (error) {
    console.error(
      "\n❌ Admin setup failed:",
      error.message
    );
  } finally {
    /*
    |--------------------------------------------------------------------------
    | Close Database Connection
    |--------------------------------------------------------------------------
    */

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    rl.close();

    console.log("\n👋 Admin setup process finished.");
  }
};

/*
|--------------------------------------------------------------------------
| Start Setup
|--------------------------------------------------------------------------
*/

createAdmin();