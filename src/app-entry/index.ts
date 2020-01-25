import IndexVue from "@/index.vue";
const appendDom = document.createElement("div");
document.body.appendChild(appendDom);

const location = document.location; // hostnameはポート名を含めない
class Main {

  constructor() {
    setTimeout(() => {
      this.checkDomInit();
    }, 1000);
  }
  private checkDomInit() {
    const playListArea = this.getPlaylistElement();
    if (!playListArea) {
      setTimeout(() => {
        this.checkDomInit();
      }, 1000);
      return;
    }
    const dom = document.createElement("div");
    const insertBefore = playListArea.querySelector<HTMLElement>("[id=contents]")!;
    const parentNode = insertBefore.parentElement!;
    parentNode.insertBefore(dom, insertBefore);
    const v2 = new IndexVue({});
    v2.$mount(dom);
  }
  private getPlaylistElement() {
    const r = [...document.querySelectorAll<HTMLElement>("ytd-two-column-browse-results-renderer ytd-item-section-renderer *[id=title-container] span[id=title]")].find(element => {
      if (!element) { return false; }
      const title = element.innerText;
      return title == "再生リスト";
    });
    if (!r) { return null; }
    let b = r;
    while (b.parentElement) {
      if (b.nodeName == "ytd-shelf-renderer".toUpperCase()) { break; }
      b = b.parentElement;
    }
    if (!b) { return null; }
    return b;
  }
}
new Main();
