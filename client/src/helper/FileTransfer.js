export class Sender {
  constructor(file, connection) {
    this.chunkSize = 16384;
    this.offset = 0;
    this.file = file;
    this.connection = connection;
    this.sendMeta();
    this.reader = new FileReader()
    this.reader.addEventListener('load', e => this.connection.send(e.target.result));
  }

  sendMeta() {
    const initJson = {
      type: "file-meta",
      fileMeta: {
        name: this.file.name,
        type: this.file.type,
        size: this.file.size
      }
    }
    this.connection.send(JSON.stringify(initJson));
  }

  sendChunk() {
    console.log((this.offset / this.file.size) * 100, "% complete")
    if (this.offset < this.file.size) {
      const fileSlice = this.file.slice(
        this.offset,
        this.offset + this.chunkSize
      )
      this.reader.readAsArrayBuffer(fileSlice);
      this.offset += fileSlice.size;
    } else {
      this.sendComplete();
    }
  }

  sendComplete() {
    const endJson = {
      type: "transfer-complete",
      fileMeta: {
        name: this.file.name,
        type: this.file.type
      }
    }
    this.connection.send(JSON.stringify(endJson))
  }
}

export class Reciver {
  constructor(meta) {
    this.buffer = [];
    this.byteRecieved = 0;
    this.fileName = meta.name;
    this.fileType = meta.type;
    this.fileSize = meta.size;
    // this.download = cb;
  }

  unload(chunk) {
    this.buffer.push(chunk);
    this.byteRecieved += chunk.byteLength || chunk.size;
    console.log((this.byteRecieved / this.fileSize) * 100, " % complete")
    if (this.byteRecieved < this.fileSize) return;
    // this.download(
    //   blob,
    //   this.fileName
    // )
  }

  download() {
    // console.log("Download file: ", filename);
    const blob = new Blob(this.buffer, { type: this.fileType });

    const downloadLink = URL.createObjectURL(blob);

    const element = document.createElement("a");
    element.setAttribute("href", downloadLink);
    element.setAttribute("download", this.fileName);
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

}
