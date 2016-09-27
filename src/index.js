import FallbackThread from "./fallback_thread";
import WorkerThread from "./worker_thread";

/* eslint-disable no-new-func */
// http://stackoverflow.com/a/31090240
const IS_NODE = !(new Function("try { return this === window; } catch (e) { return false; }"));
/* eslint-enable no-new-func */

let Thread;

if (IS_NODE) {
    Thread = global.require("../lib/node_thread");
} else {
    const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
    const createObjectURL = (window.URL && window.URL.createObjectURL) ||
        (window.webkitURL && window.webkitURL.createObjectURL);
    const Blob = window.Blob;
    const BLOB_CONSTRUCTOR = (Blob || false) && (new Blob(["test"]).size === 4);

    if (Blob && createObjectURL && (BLOB_CONSTRUCTOR || BlobBuilder)) {
        Thread = WorkerThread;
    } else {
        Thread = FallbackThread;
    }
}

export default Thread;
