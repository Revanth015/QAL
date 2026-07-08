import Layout from "../components/Layout";
import { signInWithGoogle } from "../services/authService";

function Login() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="mb-8 text-3xl font-bold">
          Login
        </h1>

        <button
          onClick={signInWithGoogle}
          className="rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
        >
          Continue with Google
        </button>
      </div>
    </Layout>
  );
}

export default Login;