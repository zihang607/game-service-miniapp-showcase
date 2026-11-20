'use strict';

const services = [
  {
    category: '入门教学', name: '新手路线教学',
    summary: '学习基础设置、地图标记和常用路线。',
    description: '从基础操作入手，根据熟练度梳理一条练习路线。适合初次了解地图或想重新建立游戏习惯的玩家。',
    specs: [{ name: '30 分钟基础指导', price: '20.00' }, { name: '60 分钟地图练习', price: '36.00' }],
  },
  {
    category: '组队陪练', name: '双人协作陪练',
    summary: '围绕沟通、站位和道具使用进行组队练习。',
    description: '在双人练习中明确分工，回顾沟通节奏和常见站位问题。',
    specs: [{ name: '一局协作练习', price: '28.00' }, { name: '两局协作练习', price: '50.00' }],
  },
  {
    category: '对局复盘', name: '个人对局复盘',
    summary: '回看关键片段，整理可执行的训练建议。',
    description: '围绕一场对局讨论目标选择、信息收集与队伍协同，整理下一场可以尝试的调整。',
    specs: [{ name: '单场复盘', price: '32.00' }],
  },
  {
    category: '入门教学', name: '进阶资源管理',
    summary: '练习装备准备与局内资源分配。',
    description: '从背包规划与补给优先级入手，通过情境练习减少对局中的临时决策。',
    specs: [{ name: '40 分钟专题教学', price: '38.00' }],
  },
];

const search = document.querySelector('#service-search');
const filters = document.querySelector('#service-filters');
const resultCount = document.querySelector('#result-count');
const serviceList = document.querySelector('#service-list');
const cardTemplate = document.querySelector('#service-template');
const emptyState = document.querySelector('#empty-state');
const detail = document.querySelector('#service-detail');

let activeCategory = '';
const categories = ['', ...new Set(services.map(({ category }) => category))];

for (const category of categories) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.category = category;
  button.textContent = category || '全部';
  button.addEventListener('click', () => {
    activeCategory = category;
    render();
  });
  filters.append(button);
}

function openDetail(service) {
  detail.querySelector('#detail-category').textContent = service.category;
  detail.querySelector('#detail-title').textContent = service.name;
  detail.querySelector('#detail-description').textContent = service.description;
  detail.querySelector('#detail-specs').replaceChildren(...service.specs.map((spec) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const price = document.createElement('strong');
    name.textContent = spec.name;
    price.textContent = `¥${spec.price}`;
    item.append(name, price);
    return item;
  }));
  detail.showModal();
}

function render() {
  const keyword = search.value.trim().toLocaleLowerCase();
  const matches = services.filter((service) => {
    const searchableText = `${service.name} ${service.category} ${service.summary}`;
    return (!activeCategory || activeCategory === service.category)
      && searchableText.toLocaleLowerCase().includes(keyword);
  });
  for (const button of filters.children) {
    button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory));
  }
  serviceList.replaceChildren(...matches.map((service) => {
    const card = cardTemplate.content.cloneNode(true);
    card.querySelector('.service-category').textContent = service.category;
    card.querySelector('.service-name').textContent = service.name;
    card.querySelector('.service-summary').textContent = service.summary;
    card.querySelector('.service-price').textContent = `¥${service.specs[0].price} 起`;
    card.querySelector('button').addEventListener('click', () => openDetail(service));
    return card;
  }));
  resultCount.textContent = `${matches.length} 项服务`;
  emptyState.hidden = matches.length !== 0;
}

search.addEventListener('input', render);
document.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  activeCategory = '';
  render();
  search.focus();
});
render();
