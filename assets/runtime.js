(() => {
  const byId = id => document.getElementById(id);
  const input = byId('control');
  document.title = config.title + ' · 可交互课件';
  document.querySelector('h1').textContent = config.title;
  document.querySelector('label').textContent = config.control;
  for (const key of ['question','challenge','limit']) byId(key).textContent = config[key];
  Object.assign(input, {min:config.min, max:config.max, step:config.step ?? 1, value:config.initial});
  const stage = byId('stage');
  let scene;
  try { scene = createScene(stage); }
  catch (error) {
    stage.textContent = '实验画面未能初始化。请在支持 WebGL 2 的浏览器中启用图形加速后重新打开。';
    input.disabled = true;
    throw error;
  }
  function render() {
    const value = Number(input.value);
    const model = compute(value);
    byId('value').textContent = value + config.unit;
    byId('result').textContent = model.summary;
    scene.draw(model);
  }
  input.addEventListener('input', render);
  byId('reset').addEventListener('click', () => {
    input.value = config.initial;
    scene.reset?.();
    render();
  });
  new ResizeObserver(render).observe(stage);
  render();
})();
