import FallbackThread from "./fallback_thread";
import WorkerThread from "./worker_thread";

const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
const createObjectURL = (window.URL && window.URL.createObjectURL) ||
    (window.webkitURL && window.webkitURL.createObjectURL);
const Blob = window.Blob;
const BLOB_CONSTRUCTOR = (Blob || false) && (new Blob(["test"]).size === 4);

let Thread;
if (Blob && createObjectURL && (BLOB_CONSTRUCTOR || BlobBuilder)) {
    Thread = WorkerThread;
} else {
    Thread = FallbackThread;
}

export default Thread;
