import { AppProvider, Page } from "@shopify/polaris";
import FileUploader from "./components/FileUploader";
import "@shopify/polaris/build/esm/styles.css";

function App() {
  return (
    <AppProvider>
      <Page title="Shopify File Uploader">
        <FileUploader />
      </Page>
    </AppProvider>
  );
}

export default App;
