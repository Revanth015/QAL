import Layout from "../components/Layout";
import { supabase } from "../config/supabase";

function Home() {
  async function testConnection() {
    console.log("Supabase Client:", supabase);

    alert("Supabase client initialized successfully!");
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Home</h1>

      <button
        onClick={testConnection}
        className="mt-6 rounded bg-purple-600 px-4 py-2 text-white"
      >
        Test Supabase
      </button>
    </Layout>
  );
}

export default Home;