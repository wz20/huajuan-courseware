const test = require('node:test');
const assert = require('node:assert/strict');
const {createLessonHistory} = require('../assets/lesson-history.js');

test('重复查询命中缓存，回退后可以查询另一本书', () => {
  const history = createLessonHistory({cache: [], visits: 0}, (s, book) => {
    if (!s.cache.includes(book)) {
      s.cache.push(book);
      s.visits++;
    }
    return s;
  });
  history.act('甲');
  assert.equal(history.act('甲').visits, 1);
  history.back();
  assert.deepEqual(history.act('乙'), {cache: ['甲', '乙'], visits: 2});
  assert.equal(history.canForward, false);
  assert.deepEqual(history.reset(), {cache: [], visits: 0});
});

test('请求、抵达、回报可分别观察，非法跳步不丢失重放路径', () => {
  const history = createLessonHistory({floor: 1, panel: '空闲'}, (s, event) => {
    if (event === '呼梯') return {...s, panel: '等待'};
    if (event === '抵达' && s.panel === '等待') return {...s, floor: 3};
    if (event === '回报' && s.floor === 3) return {...s, panel: '已到'};
  });
  assert.deepEqual(history.act('呼梯'), {floor: 1, panel: '等待'});
  assert.deepEqual(history.act('抵达'), {floor: 3, panel: '等待'});
  history.back();
  history.act('回报').floor = 99;
  assert.equal(history.read().floor, 1);
  assert.equal(history.canForward, true);
  history.forward();
  assert.deepEqual(history.act('回报'), {floor: 3, panel: '已到'});
});
