/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
    CSSResultArray,
    html,
    PropertyValueMap,
    PropertyValues,
    TemplateResult,
} from '@spectrum-web-components/base';
import { ifDefined } from '@spectrum-web-components/base/src/directives.js';
import {
    property,
    query,
} from '@spectrum-web-components/base/src/decorators.js';
import { Focusable, LikeAnchor } from '@spectrum-web-components/shared';

import itemStyles from '@spectrum-web-components/tabs/src/tab.css.js';
import topNavItemStyles from './top-nav-item.css.js';

/**
 * @element sp-top-nav-item
 *
 * @slot - text label of the Top Nav Item
 */

export class TopNavItem extends LikeAnchor(Focusable) {
    public static override get styles(): CSSResultArray {
        return [itemStyles, topNavItemStyles];
    }

    @query('a')
    private anchor!: HTMLAnchorElement;

    @property({ type: Boolean, reflect: true })
    public selected = false;

    public value = '';

    public override get focusElement(): HTMLAnchorElement {
        return this.anchor;
    }

    public override click(): void {
        this.anchor.click();
    }

    protected override render(): TemplateResult {
        return html`
            <a
                id="item-label"
                href=${ifDefined(this.href)}
                download=${ifDefined(this.download)}
                target=${ifDefined(this.target)}
                aria-label=${ifDefined(this.label)}
                aria-current=${ifDefined(
                    this.selected && this.href ? 'page' : undefined
                )}
                rel=${ifDefined(this.rel)}
            >
                <slot></slot>
            </a>
        `;
    }

    protected override firstUpdated(
        changes: PropertyValueMap<unknown> | Map<PropertyKey, unknown>
    ): void {
        super.firstUpdated(changes);
    }

    protected override updated(changes: PropertyValues): void {
        super.updated(changes);
        this.value = this.anchor.href;
    }

    public constructor() {
        super();

        const editSortableMenuButton =
            document.getElementById('edit-sortable-menu');
        const resetSortableMenuButton = document.getElementById(
            'reset-sortable-menu'
        );
        const saveSortableMenuButton =
            document.getElementById('save-sortable-menu');
        const cancelSortableMenuButton = document.getElementById(
            'cancel-sortable-menu'
        );
        const sortableMenu = document.getElementById(
            'sortable-menu'
        ) as HTMLElement;

        if (localStorage.getItem('lastQuicklinksOrder') !== null) {
            const reorderedList = this.getArrayFromLocalStorage(
                'lastQuicklinksOrder'
            );
            this.reorderList(reorderedList);
        } else if (localStorage.getItem('originalQuicklinksOrder') !== null) {
            const originalListOrder = this.getArrayFromLocalStorage(
                'originalQuicklinksOrder'
            );
            this.reorderList(originalListOrder);
        }

        const items = sortableMenu.querySelectorAll('li');

        items.forEach((item: HTMLElement) => {
            const dragHandleIcon = item.querySelectorAll('sp-icon-drag-handle');
            dragHandleIcon[0]?.setAttribute('style', 'display: none;');
        });

        editSortableMenuButton?.addEventListener('click', () => {
            const items = sortableMenu.querySelectorAll('li');
            saveSortableMenuButton?.removeAttribute('hidden');
            cancelSortableMenuButton?.removeAttribute('hidden');

            const originalPos: string[] = [];
            items.forEach((item: HTMLElement, index: number) => {
                originalPos.push(String(index));
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.paddingLeft = '12px';
                const menuItem = item.querySelectorAll('sp-menu-item');
                menuItem[0]?.setAttribute('disabled', '');

                const dragHandleIcon = item.querySelectorAll(
                    'sp-icon-drag-handle'
                );
                dragHandleIcon[0]?.setAttribute('style', 'display: block;');
            });

            if (!localStorage.getItem('originalQuicklinksOrder')) {
                localStorage.setItem(
                    'originalQuicklinksOrder',
                    JSON.stringify(originalPos)
                );
            }
        });

        resetSortableMenuButton?.addEventListener('click', () => {
            if (localStorage.getItem('originalQuicklinksOrder') !== null) {
                const originalListOrder = this.getArrayFromLocalStorage(
                    'originalQuicklinksOrder'
                );
                this.reorderList(originalListOrder);
                localStorage.removeItem('lastQuicklinksOrder');
                localStorage.removeItem('originalQuicklinksOrder');
            }
        });

        saveSortableMenuButton?.addEventListener('click', () => {
            const items = sortableMenu.querySelectorAll('li');
            const lastOrderPos: string[] = [];
            items.forEach((item: HTMLElement) => {
                item.style.paddingLeft = '0';
                const menuItem = item.querySelectorAll('sp-menu-item');
                menuItem[0]?.removeAttribute('disabled');
                const dataOrder = item.getAttribute('data-index');
                lastOrderPos.push(String(dataOrder));

                const dragHandleIcon = item.querySelectorAll(
                    'sp-icon-drag-handle'
                );
                dragHandleIcon[0]?.setAttribute('style', 'display: none;');
            });

            localStorage.setItem(
                'lastQuicklinksOrder',
                JSON.stringify(lastOrderPos)
            );

            saveSortableMenuButton?.setAttribute('hidden', '');
            cancelSortableMenuButton?.setAttribute('hidden', '');
        });

        cancelSortableMenuButton?.addEventListener('click', () => {
            const items = sortableMenu.querySelectorAll('li');
            items.forEach((item: HTMLElement) => {
                item.style.paddingLeft = '0';
                const menuItem = item.querySelectorAll('sp-menu-item');
                menuItem[0]?.removeAttribute('disabled');

                const dragHandleIcon = item.querySelectorAll(
                    'sp-icon-drag-handle'
                );
                dragHandleIcon[0]?.setAttribute('style', 'display: none;');
            });

            if (localStorage.getItem('lastQuicklinksOrder') !== null) {
                const reorderedList = this.getArrayFromLocalStorage(
                    'lastQuicklinksOrder'
                );
                this.reorderList(reorderedList);
            } else {
                const originalListOrder = this.getArrayFromLocalStorage(
                    'originalQuicklinksOrder'
                );
                this.reorderList(originalListOrder);
            }

            saveSortableMenuButton?.setAttribute('hidden', '');
            cancelSortableMenuButton?.setAttribute('hidden', '');
        });

        this.initializeSortableMenu();
    }

    private initializeSortableMenu(): void {
        const sortableMenu = document.getElementById(
            'sortable-menu'
        ) as HTMLElement;
        if (!sortableMenu) return;

        if (sortableMenu.dataset.initialized) {
            return;
        }

        sortableMenu.dataset.initialized = 'true';

        sortableMenu.classList.add('slist');
        const items = sortableMenu.querySelectorAll('li');
        let current: HTMLLIElement | null = null;

        items.forEach((item) => {
            item.draggable = true;

            item.addEventListener('dragstart', () => {
                current = item;
                items.forEach((it) => {
                    if (it !== current) it.classList.add('hint');
                });
            });

            item.addEventListener('dragenter', () => {
                if (item !== current) item.classList.add('active');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('active');
            });

            item.addEventListener('dragend', () => {
                items.forEach((it) => {
                    it.classList.remove('hint', 'active');
                });
            });

            item.addEventListener('dragover', (event: DragEvent) => {
                event.preventDefault();
            });

            item.addEventListener('drop', (event: DragEvent) => {
                event.preventDefault();
                if (item !== current && current) {
                    const currentpos = Array.from(items).indexOf(current);
                    const droppedpos = Array.from(items).indexOf(item);
                    if (currentpos < droppedpos) {
                        item.parentNode?.insertBefore(
                            current,
                            item.nextSibling
                        );
                    } else {
                        item.parentNode?.insertBefore(current, item);
                    }
                }
            });
        });
    }

    private reorderList(orderArray: string[]): void {
        const sortableMenu = document.getElementById(
            'sortable-menu'
        ) as HTMLElement;
        const items = Array.from(sortableMenu.children);

        const itemMap = new Map();
        items.forEach((item) => {
            const index = item.getAttribute('data-index');
            itemMap.set(index, item);
        });

        sortableMenu.innerHTML = '';

        orderArray.forEach((index) => {
            const item = itemMap.get(index);
            if (item) {
                sortableMenu.appendChild(item);
            }
        });
    }

    private getArrayFromLocalStorage(key: string) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const array = JSON.parse(value);
                if (Array.isArray(array)) {
                    return array;
                } else {
                    console.error(`'${key}' is not an array.`);
                    return [];
                }
            } catch (event) {
                console.error(`Error parsing the key '${key}':`, event);
                return [];
            }
        } else {
            console.warn(`The key '${key}' is not on localStorage.`);
            return [];
        }
    }
}
