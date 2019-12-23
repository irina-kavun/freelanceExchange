document.addEventListener('DOMContentLoaded', () => {
   'use strict';

    const customer = document.getElementById('customer'),
        freelancer = document.getElementById('freelancer'),
        blockCustomer = document.getElementById('block-customer'),
        blockFreelancer = document.getElementById('block-freelancer'),
        blockChoice = document.getElementById('block-choice'),
        btnExit = document.getElementById('btn-exit'),
        formCustomer = document.getElementById('form-customer'),
        ordersTable = document.getElementById('orders'),
        modalOrder = document.getElementById('order_read'),
        modalOrderActive = document.getElementById('order_active'),
        headTable = document.getElementById('headTable');

    //получаем даные из local storage, если их нет то подготавливаем массив
    const orders = JSON.parse(localStorage.getItem('freeOrders')) || [];

    //сохранение в local storage
    const toStorage = () => {
        localStorage.setItem('freeOrders', JSON.stringify(orders))
    };

    //для склонения слов в зависимости от числа (1 день 2 дня 5 дней)
    const declOfNum = (number, titles) => number + ' ' + titles[(number % 100 > 4 && number % 100 < 20) ? 2 :
        [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]];

    //высчитываем дедлайн
    const calcDeadline = (date) => {
        const deadline = new Date(date);
        const toDay = Date.now();
        //сколько осталось (милисикунд)
        const remaining = (deadline - toDay) / 1000 / 60 / 60;
        //если меньше 2х дней то в часах
        if( (remaining / 24) > 2){
            return declOfNum(Math.floor(remaining / 24), ['день', 'дня', 'дней']);
        }

        return declOfNum(Math.floor(remaining), ['час', 'часа', 'часов']);
    };

    //отрисовка во фриланс таблице
    const renderOrders = () => {
        ordersTable.textContent = '';

        orders.forEach((order, i) => {
        ordersTable.innerHTML += `
        <tr class="order ${order.active ? 'taken' : ''}" 
            data-number-order="${i}">
            <td>${i+1}</td>
            <td>${order.title}</td>
            <td class="${order.currency}"></td>
            <td>${calcDeadline(order.deadline)}</td>
        </tr>`
        });

    };

    const openModal = (numberOrder) => {
        const order = orders[numberOrder];
        const { title, firstName, email, phone, description, amount, currency, deadline, active = false } = order;

        const modal = active ? modalOrderActive : modalOrder;

        const firstNameBlock = modal.querySelector('.firstName'),
            titleBlock = modal.querySelector('.modal-title'),
            emailBlock = modal.querySelector('.email'),
            descriptionBlock = modal.querySelector('.description'),
            deadlineBlock = modal.querySelector('.deadline'),
            currencyBlock = modal.querySelector('.currency_img'),
            countBlock = modal.querySelector('.count'),
            phoneBlock = modal.querySelector('.phone');

        modal.id = numberOrder;
        titleBlock.textContent = title;
        firstNameBlock.textContent = firstName;
        emailBlock.textContent = email;
        emailBlock.href = 'mailto:' + email;
        descriptionBlock.textContent = description;
        deadlineBlock.textContent = calcDeadline(deadline);
        currencyBlock.className = 'currency_img';
        currencyBlock.classList.add(currency);
        countBlock.textContent = amount;

        phoneBlock && (phoneBlock.href = 'tel:' + phone);

        modal.style.display = 'flex';

        modal.addEventListener('click', handlerModal);
    };

    //обработчик для события внутри модального окна
    const handlerModal = event => {
      const target = event.target;
      const modal = target.closest('.order-modal');
      const order = orders[modal.id];

        //базовые действия во всех кейсах
      const baseAction = () => {
          modal.style.display = 'none';
          toStorage();
          renderOrders();
      };

        //закрываем модальное окно на крестик
      if(target.closest('.close') || target === modal) {
          modal.style.display = 'none';
      }
        //получаем заказ
      if (target.classList.contains('get-order')) {
          order.active = true;
          baseAction();
      }
        //отменяем заказ
        if (target.id === 'capitulation') {
            order.active = false;
            baseAction();
        }
        //выполнили заказ
        if (target.id === 'ready') {
            orders.splice(orders.indexOf(order), 1);
            baseAction();
        }
    };

    //сортировка обьектов в массиве
    const sortOrder = (arr, property) => {
        arr.sort( (a, b) => a[property] > b[property]  ? 1 : -1 );
    };

    //обработчик сортировки заказов
    headTable.addEventListener('click', (event) => {
        const target = event.target;
        if(target.classList.contains('head-sort')){

            if(target.id === 'taskSort'){
                sortOrder(orders, 'title');
            }

            if(target.id === 'currencySort'){
                sortOrder(orders, 'currency');
            }

            if(target.id === 'deadlineSort'){
                sortOrder(orders, 'deadline');
            }

            toStorage();
            renderOrders();
        }
    });

//обработчик открытия модального окна определенного заказа
    ordersTable.addEventListener('click', event => {
       const target = event.target;

       const targetOrder = target.closest('.order');

       if (targetOrder) {
            openModal(targetOrder.dataset.numberOrder)
       }

    });
//обработчик нажатия на кнопку Заказчика
    customer.addEventListener('click', () => {
       blockChoice.style.display = 'none';
       blockCustomer.style.display = 'block';
        //минимальное значение даты заказа
        const toDay = new Date().toISOString().substring(0,10);
        document.getElementById('deadline').min = toDay;

       btnExit.style.display = 'block';
   });
//обработчик нажатия на кнопку фрилансера
    freelancer.addEventListener('click', () => {
       blockChoice.style.display = 'none';
       renderOrders();
       blockFreelancer.style.display = 'block';
       btnExit.style.display = 'block';
   });

    //обработчик нажатия на кнопку Выход
    btnExit.addEventListener('click', () => {
        btnExit.style.display = 'none';
        blockCustomer.style.display = 'none';
        blockFreelancer.style.display = 'none';
        blockChoice.style.display = 'block';
    });
    //обработчик формы заказа
    formCustomer.addEventListener('submit', (event) => {
       event.preventDefault();

       const obj = {};

        //фильтрация массива элементов
       const elements = [...formCustomer.elements]
           .filter(elem => (elem.tagName === 'INPUT' && elem.type !== 'radio') ||
                   (elem.type === 'radio' && elem.checked) ||
                   elem.tagName === 'TEXTAREA');
        //перебор массива уже отфильтрованых элементов
       elements.forEach(elem => {
               obj[elem.name] = elem.value;
       });
           formCustomer.reset();

       // перебор коллекции
       // for (const elem of formCustomer.elements) {
       //     if((elem.tagName === 'INPUT' && elem.type !== 'radio') ||
       //         (elem.type === 'radio' && elem.checked) ||
       //         elem.tagName === 'TEXTAREA'
       //     ){
       //         obj[elem.name] = elem.value;
       //
       //         if (elem.type !== 'radio') {
       //             elem.value = '';
       //         }
       //     }
       // }
        orders.push(obj);
        toStorage()
    });
});