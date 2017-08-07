'use strict';

Vue.use(VueMask.VueMaskPlugin);
Vue.directive('mask', VueMask.VueMaskDirective);

const MyForm = Object.seal(new Vue({
    el: '#app',
    data: function() {
        return {
            form: {
                fio: {
                    value: '',
                    placeholder: 'ФИО',
                    pattern: '[а-яА-Яa-zA-Z]+\\s[а-яА-Яa-zA-Z]+\\s[а-яА-Яa-zA-Z]+$'
                },
                email: {
                    value: '',
                    placeholder: 'my_email@yandex.ru',
                    pattern: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@\\ya.ru$|yandex.ru$|yandex.ua$|yandex.by$|yandex.kz$|yandex.com$'
                },
                phone: {
                    value: '',
                    placeholder: '+7(999)999-99-99',
                    pattern: '\\+7\\(\\d{3}\\)\\d{3}\\-\\d{2}\\-\\d{2}',
                    mask: '+7(###)###-##-##'
                }
            },
            currentApiURL: 'api/success.json',
            apiURLs: ['api/success.json', 'api/error.json', 'api/progress.json'],
            message: '',
            status: '',
            btnDisabled: false
        }
    },
    methods: {
        submit: function () { // Метод submit выполняет валидацию полей и отправку ajax-запроса, если валидация пройдена. Вызывается по клику на кнопку отправить.
            const self = this;
            const valid = self.validate();
            if(valid.isValid){
                self.btnDisabled = true;
                const data = self.getData();
                axios.post(self.currentApiURL, {
                    data: data
                }).then(function(response){
                    switch (response.data.status) {
                        case 'success':
                            self.status = 'success';
                            self.message = 'Success';
                            break;
                        case 'error':
                            self.status = 'error';
                            self.message = response.data.reason;
                            break;
                        case 'progress':
                            self.status = 'progress';
                            self.message = 'Progress...';
                            setTimeout(function(){
                                self.submit();
                            }, response.data.timeout);
                            break;
                        default:
                            self.status = 'error';
                            console.log('Неопознанная ошибка!');
                    }
                }).catch(function(error){
                    console.log(error);
                });
            }
        },
        validate: function(){ // Метод validate возвращает объект с признаком результата валидации (isValid) и массивом названий полей, которые не прошли валидацию (errorFields).
            let isValid = true;
            const form = this.form;
            const errorFields = [];
            function pushErrorProp(prop) {
                isValid = false;
                errorFields.push(prop);
            }
            function addRemoveClass(arr) {
                const errorFields = arr || [];
                const inputs = document.getElementsByTagName('input');
                for (let i =0; i < inputs.length; i++) {
                    if (errorFields.indexOf(inputs[i].getAttribute('name')) + 1) {
                        inputs[i].classList.add('error');
                    } else {
                        inputs[i].classList.remove('error');
                    }
                }
            }
            Object.keys(form).map(function(objectKey) {
                let pattern = new RegExp(form[objectKey].pattern);
                if (!pattern.test(form[objectKey].value)) {
                    pushErrorProp(objectKey);
                } else if (objectKey === 'phone') {
                    let phone = form[objectKey].value.replace(/\D/g,'').split('');
                    let sum = 0;
                    for(let i = 0; i < phone.length; i++){
                        sum += parseFloat(phone[i]);
                    }
                    if (sum > 30) {
                        pushErrorProp(objectKey);
                    }
                }
            });
            addRemoveClass(errorFields);
            return {isValid: isValid, errorFields: errorFields};
        },
        getData: function(){ // Метод getData возвращает объект с данными формы, где имена свойств совпадают с именами инпутов.
            const data = {};
            const form = this.form;
            Object.keys(form).map(function(objectKey) {
                data[objectKey] = form[objectKey].value;
            });
            return data;
        },
        setData: function(obj){ // Метод setData принимает объект с данными формы и устанавливает их инпутам формы. Поля кроме phone, fio, email игнорируются.
            const self = this;
            Object.keys(obj).map(function(key) {
                if (typeof self.form[key] !== 'undefined') {
                    if (key === 'phone') {
                        const phone = obj[key].replace(/\D/g,'').split('');
                        if (phone.length === 11) {
                            self.form[key].value = `+7(${phone[1]}${phone[2]}${phone[3]})${phone[4]}${phone[5]}${phone[6]}-${phone[7]}${phone[8]}-${phone[9]}${phone[10]}`;
                        } else if (phone.length === 10) {
                            self.form[key].value = `+7(${phone[0]}${phone[1]}${phone[2]})${phone[3]}${phone[4]}${phone[5]}-${phone[6]}${phone[7]}-${phone[8]}${phone[9]}`;
                        } else {
                            self.form[key].value = obj[key];
                        }
                    } else {
                        self.form[key].value = obj[key];
                    }
                }
            });
        }
    }
}));
