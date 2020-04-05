/* eslint-disable prettier/prettier */

const ace = require('ace-builds');
const marked = require('marked');
const Dexie = require('dexie').default;

// const db = new dexie.Dexie({ databaseName: 'LocalNoteDb' });
// db.version(1).stores({
//   files: '++id,name,path',
// });
const db = new Dexie({ databaseName: 'LocalNoteDb' });
db.version(1).stores({
  files: '++id',
});
// db.version(2).stores({
//   files: '++id,name,path,tab,content,updated_dt',
// });
// db.open();

// db.files.put({
//   name: 'filename',
//   path: undefined,
//   tab: true,
//   updated_dt: new Date(),
// });
// console.log('keys :' + JSON.stringify(db.files.toArray(), null, 2));

// db.files.where('name').equals('Undefined').delete();

/**
 * 初期処理
 */
async function init() {
  // データ０件の場合、初期値設定
  await db.files.toCollection().count(async (count) => {
    if (count === 0) {
      await db.files.put({
        name: 'default.md',
        path: undefined,
        tab: true,
        updated_dt: new Date(),
      });
    }
  });
  // 編集していないタブを削除
  await db.files.toArray().then((files) => {
    for (let i = 0; i < files.length; i++) {
      console.log('files[i].name : ' + files[i].name);
      console.log('files[i].content : ' + files[i].content);
      if (files[i].name === 'Undefined' && files[i].content == '') {
        console.log('del id:' + files[i].id);
        db.files.where('id').anyOf(files[i].id).delete();
      }
    }
  });
  await db.files.toArray().then((files) => {
    for (let i = 0; i < files.length; i++) {
      // console.log('files[i].name : ' + files[i].name);
      // console.log('files[i].content : ' + files[i].content);
      let tab = document.createElement('div');
      tab.classList = 'tab-content tab-closable';
      if (i === 0) tab.classList.add('tab-active');
      tab.dataset.id = files[i].id;
      tab.dataset.name = files[i].name;
      tab.dataset.path = files[i].path;
      tab.dataset.tab = files[i].tab;
      tab.innerText = files[i].name;
      console.log(tab);
      if (files[i].tab) {
        document.querySelector('#tab-content-left').appendChild(tab);
      }
      // コンテンツのラストに＋ボタン付与
      if (i === files.length - 1) {
        let plus = document.createElement('div');
        plus.classList = 'tab-plus';
        plus.innerHTML = '<i class="fas fa-plus"></i>';
        plus.addEventListener('click', () => {
          removeActiveTabContent();
          let tab = document.createElement('div');
          tab.classList = 'tab-content tab-closable tab-active';
          tab.dataset.id = '';
          tab.dataset.name = 'Undefined';
          tab.dataset.path = '';
          tab.dataset.tab = true;
          tab.innerText = 'Undefined';
          document.querySelector('.tab-plus').insertAdjacentElement('beforeBegin', tab);
          addTabContentClosable();
          changeTabContent();
          setEditor();
        });
        document.querySelector('#tab-content-left').appendChild(plus);
      }
    }
    addTabContentClosable();
    changeTabContent();
    setEditor();
    console.log(files);
  });
  await db.files.toArray().then((files) => {
    for (let i = 0; i < files.length; i++) {
      let div = document.createElement('div');
      div.classList.add('explore-file');
      div.dataset.id = files[i].id;
      div.innerText = files[i].name;
      div.addEventListener('click', () => {
        // Select tab
        let tabContent = document.querySelectorAll('.tab-content');
        removeActiveTabContent();
        tabContent.forEach((el) => {
          if (Number(el.dataset.id) === files[i].id) {
            el.classList.add('tab-active');
          }
        });
        const isExistActiveTab = document.querySelector('.tab-active');
        if (!isExistActiveTab) {
          let tab = document.createElement('div');
          tab.classList = 'tab-content tab-closable tab-active';
          tab.dataset.id = files[i].id;
          tab.dataset.name = files[i].name;
          tab.dataset.path = files[i].path;
          tab.dataset.tab = true;
          tab.innerText = files[i].name;
          document.querySelector('.tab-plus').insertAdjacentElement('beforeBegin', tab);
          addTabContentClosable();
          changeTabContent();
        }
        // Editor
        setEditor();
      });
      document.querySelector('#openedFiles').appendChild(div);
    }
  });
}
init();
// db.files.clear();

// ==================================================
//                  << ACE EDITOR >>
// ==================================================
var editor = ace.edit('editor');
editor.setTheme('ace/theme/monokai');
// editor.session.setMode('ace/mode/javascript');
editor.session.setMode('ace/mode/markdown');

// if (localStorage.getItem('filename')) {
//   editor.setValue(localStorage.getItem('filename'));
// }
// console.log(localStorage.getItem('filename'));
let viewer = document.querySelector('#viewer');
viewer.innerHTML = marked(editor.getValue());
editor.getSession().on('change', function () {
  saveFile();
  viewer.innerHTML = marked(editor.getValue());
});

/**
 * アクティブなタブの情報をファイル保存
 */
function saveFile() {
  const tab = document.querySelector('.tab-active');
  const isNew = tab.dataset.id ? false : true;
  let data = {};
  if (!isNew) {
    data.id = Number(tab.dataset.id);
  }
  data.name = tab.dataset.name;
  data.path = tab.dataset.path;
  data.tab = true;
  data.content = editor.getValue();
  data.updated_dt = new Date();
  db.files.put(data);
  if (isNew) {
    db.files.toArray().then((files) => {
      console.log('last file id:' + files[files.length - 1].id);
      tab.dataset.id = files[files.length - 1].id;
    });
  }
}

/**
 * エディターにアクティブなタブのコンテンツを設定
 */
function setEditor() {
  const activeTabElement = document.querySelector('.tab-active');
  if (activeTabElement) {
    console.log('+++' + activeTabElement.dataset.id);
    // db.files.get(Number(activeTabElement.dataset.id)).then((file) => {
    //   console.log(file);
    //   editor.setValue(file.content);
    // });
    db.files
      .where('id')
      .equals(Number(activeTabElement.dataset.id))
      .first()
      .then((file) => {
        console.log(JSON.stringify(file));
        editor.setValue(file ? file.content : '');
      });
  }
}

/**
 * タブコンテンツにClose付与
 */
function addTabContentClosable() {
  let tabClosableContent = document.querySelectorAll('.tab-closable');
  for (let i = 0; i < tabClosableContent.length; i++) {
    if (tabClosableContent[i].querySelector('.tab-close')) {
      continue;
    }
    // console.log(tabClosableContent[i].getElementsByClassName('tab-close'));
    let div = document.createElement('div');
    div.classList.add('tab-close');
    div.addEventListener('click', (e) => {
      // 閉じる対象の左側のタブを選択
      let tab = document.querySelectorAll('.tab-content')[i - 1];
      if (tab) {
        tab.classList.add('tab-active');
      }
      tabClosableContent[i].remove();
      // DB処理：tabをfalseに変更
      db.files.update(Number(tabClosableContent[i].dataset.id), { tab: false });
    });
    tabClosableContent[i].appendChild(div);
  }
}

/**
 * タブコンテンツの切り替え
 */
function changeTabContent() {
  let tabContent = document.querySelectorAll('.tab-content');
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].addEventListener('click', () => {
      for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].classList.remove('tab-active');
      }
      if (document.querySelectorAll('.tab-content')[i]) {
        tabContent[i].classList.add('tab-active');
      } else {
        tabContent[i - 1].classList.add('tab-active');
      }
      setEditor();
    });
    tabContent[i].addEventListener('dblclick', () => {
      const newFileName = window.prompt('ファイル名を変更', tabContent[i].dataset.name);
      if (!newFileName) return;
      tabContent[i].dataset.name = newFileName;
      tabContent[i].textContent = newFileName;
      db.files.put({
        id: Number(tabContent[i].dataset.id),
        name: tabContent[i].dataset.name,
      });
      addTabContentClosable();
    });
  }
}

/**
 * アクティブタブを削除
 */
function removeActiveTabContent() {
  let tabContent = document.querySelectorAll('.tab-content');
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].classList.remove('tab-active');
  }
}

/**
 * Event
 */
document.querySelector('.toggle-viewer').addEventListener('click', function () {
  document.querySelector('#viewer').classList.toggle('hide');
});
document.querySelector('#dropdown-overlay').addEventListener('click', function () {
  if (document.querySelector('.dropdown-show')) {
    document.querySelector('.dropdown-show').classList.remove('dropdown-show');
  }
  if (document.querySelector('.dropdown-show-right')) {
    document.querySelector('.dropdown-show-right').classList.remove('dropdown-show-right');
  }
  document.querySelector('#dropdown-overlay').classList.remove('show');
});

document.querySelector('.dropdown-btn').addEventListener('click', function (e) {
  e.target.parentElement.parentElement
    .getElementsByClassName('dropdown-list')[0]
    .classList.toggle('dropdown-show');
  e.target.parentElement.classList.toggle('dropdown-index');
  document.querySelector('#dropdown-overlay').classList.toggle('show');
});
document.querySelector('.dropdown-btn-right').addEventListener('click', function (e) {
  e.target.parentElement.parentElement
    .getElementsByClassName('dropdown-list')[0]
    .classList.toggle('dropdown-show-right');
  e.target.parentElement.classList.toggle('dropdown-index');
  document.querySelector('#dropdown-overlay').classList.toggle('show');
});

document.querySelectorAll('.sidebar-menu').forEach((el) => {
  el.addEventListener('click', () => {
    if (!el.classList.contains('sidebar-active')) {
      // console.log('remove sidebar active');
      document.querySelectorAll('.sidebar-menu').forEach((el) => {
        el.classList.remove('sidebar-active');
        document.querySelector('#' + el.dataset.id).classList.add('hide');
      });
    }
    el.classList.toggle('sidebar-active');

    console.log('sidebar dataset id :' + el.dataset.id);
    if (el.classList.contains('sidebar-active')) {
      document.querySelector('#' + el.dataset.id).classList.remove('hide');
    } else {
      document.querySelector('#' + el.dataset.id).classList.add('hide');
    }
  });
});

/**
 * 初期化
 */
(function () {
  let setHeight =
    window.innerHeight -
    (document.querySelector('#menu').offsetHeight +
      document.querySelector('#tab-content-wrapper').offsetHeight +
      document.querySelector('#setting').offsetHeight +
      document.querySelector('#footer').offsetHeight +
      20);
  document.querySelector('#viewer').style.height = setHeight + 'px';
  const viewerHeight = document.querySelector('#viewer').offsetHeight;
  document.querySelector('#editor').style.height = viewerHeight + 'px';
})();
window.onresize = function () {
  const viewerHeight = document.querySelector('#viewer').offsetHeight;
  document.querySelector('#editor').style.height = viewerHeight + 'px';
};
