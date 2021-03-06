import { Component, Element, h, Host, State } from '@stencil/core';
import { buildRoute, envState, filter, LeagueService, RoleLevel, User } from 'ftb-models';
import { CategoryInterface } from 'ftb-cmp/dist/types/components/ftb-searchable-content/ftb-searchable-content.component';
import sortBy from 'lodash-es/sortBy';
import uniqBy from 'lodash-es/uniqBy';
import uniq from 'lodash-es/uniq';
import { getAgePluralForm } from '@src/utils/plural-form';
import ArrowForwardIcon from '../../assets/icons/arrow-back.svg';
import { routes } from '@src/utils/routes';

@Component({
  tag: 'ffspb-referees-page',
  styleUrl: 'ffspb-referees-page.component.scss',
  shadow: false,
})
export class FfspbRefereesPage {
  @State() mode: 'referees' | 'inspectors' = 'referees';
  @State() persons: User[];
  @Element() el;

  async componentWillLoad() {
    const league = await new LeagueService().loadLeagueStaff(544);
    this.persons = league.staff.filter(u => u.roles.some(r => r.level == RoleLevel.referee || r.level == RoleLevel.inspector));
    this.persons = [
      ...league.staff.filter(u => u.roles.some(r => r.level == RoleLevel.referee)).slice(0, 9),
      ...league.staff.filter(u => u.roles.some(r => r.level == RoleLevel.inspector)).slice(0, 9),
    ];
  }

  componentDidLoad() {
    const checkSize = () => {
      const searchContents = Array.from(this.el.querySelectorAll('ftb-searchable-content'));
      const heights = searchContents.map(b => b['offsetHeight']);
      if (!heights[0]) {
        return requestAnimationFrame(checkSize);
      } else {
        const maxHeight = Math.max(...heights);
        searchContents.forEach((el: HTMLFtbSearchableContentElement) => {
          el.style['min-height'] = maxHeight + 'px';
        });
      }
    };
    checkSize();
  }

  render() {
    return (
      <Host class={envState.platform == 'web' ? 'desktop' : 'mobile'}>
        <ffspb-header />
        <ffspb-content>
          {this.renderHead()}
          {this.renderCategoryHeader()}
          <ffspb-content-inner>
            {this.renderSwitch()}
            {this.renderCards()}
          </ffspb-content-inner>
          <ffspb-footer />
        </ffspb-content>
      </Host>
    );
  }

  async filterRef(items: any[], query: string, categories: CategoryInterface[]) {
    const city = categories.find(c => c.key === 'city')?.options.find(o => o.selected)?.key;
    if (city && city !== 'all') {
      items = items.filter(r => r.city == city);
    }
    const extra = categories.find(c => c.key === 'extra')?.options.find(o => o.selected)?.key;
    if (extra && extra !== 'all') {
      items = items.filter(r => r.roles.some(role => role.extra == extra));
    }
    return filter(items, query, ['name']);
  }

  getCategories(mode: 'referees' | 'inspectors') {
    const items = this.persons.filter(p => p.roles.some(r => r.level == (mode == 'referees' ? RoleLevel.referee : RoleLevel.inspector)));
    const cities = uniqBy(items, 'city').map(r => r.city);

    const categories = [];
    if (cities.length > 1) {
      categories.push({
        key: 'city',
        placeholder: '??????????',
        filterFn: (query, options) => filter(options, query, ['text']),
        renderItem: i => i.text,
        options: [{ key: 'all', text: '?????? ????????????' }, ...cities.map(c => ({ key: c, text: c }))],
      });
    }

    const extras = uniq(items.map(r => r.roles.find(role => Boolean(role.extra))?.extra).filter(Boolean));
    if (extras.length > 1) {
      categories.push({
        key: 'extra',
        placeholder: '??????????',
        filterFn: (query, options) => filter(options, query, ['text']),
        renderItem: i => i.text,
        options: [{ key: 'all', text: '?????? ??????????????????' }, ...extras.map(c => ({ key: c, text: c }))],
      });
    }

    return categories;
  }

  renderHead() {
    return (
      <ffspb-page-head>
        <div slot="head">???????????????????????? ?????????? ???????????????????? ?????????? ?? ?????????????????????? ?????????????????? ?????????????? ??????????-????????????????????</div>
        <p slot="text">
          ?????? ?????????? ???????????????????????? ?????????????????? ?????????????????? ?????????????????????? ?????????????????????? ?????????? ?? ???????????????????? ?????????????????????? ?? ?????????????????? ???????????????? ?????????? ?????????????????????? ?????????????????? ?? 2013 ????????
        </p>
        <ffspb-button color="steel" href={routes.referees_training} slot="button">
          ??????????????????
        </ffspb-button>
        <img src={`/assets/demo/img/banners/3.jpg`} class="banner-img" slot="img" />
      </ffspb-page-head>
    );
  }

  renderCategoryHeader() {
    return <h3 class="section-header">?????????????????? ????????????</h3>;
  }

  renderSwitch() {
    return (
      <ffspb-switch
        options={[
          { key: 'referees', text: '??????????' },
          { key: 'inspectors', text: '????????????????????' },
        ]}
        onSelected={e => (this.mode = e.detail.key as 'referees' | 'inspectors')}
      />
    );
  }

  renderCards() {
    const wrapItems = items => {
      if (envState.platform == 'web') {
        return <div class="referees-list grid">{items.map(i => this.renderCard(i))}</div>;
      } else {
        return <ftb-virtual-scroll items={items} itemHeight={132} renderItem={i => this.renderCard(i)} />;
      }
    };

    return [
      <ftb-searchable-content
        items={this.persons.filter(p => p.roles.some(r => r.level == RoleLevel.referee))}
        filterFn={this.filterRef}
        placeholder="?????????? ???? ?????????? ??????????"
        categories={this.getCategories('referees')}
        debounce={50}
        class={{ hidden: this.mode != 'referees' }}
        renderItems={items => (items.length ? wrapItems(sortBy(items, 'name')) : <p class="nothing-found">???????????? ???? ??????????????</p>)}
      />,
      <ftb-searchable-content
        items={this.persons.filter(p => p.roles.some(r => r.level == RoleLevel.inspector))}
        filterFn={this.filterRef}
        placeholder="?????????? ???? ?????????? ????????????????????"
        categories={this.getCategories('inspectors')}
        debounce={50}
        class={{ hidden: this.mode != 'inspectors' }}
        renderItems={items => (items.length ? wrapItems(sortBy(items, 'name')) : <p class="nothing-found">???????????? ???? ??????????????</p>)}
      />,
    ];
  }

  renderCategory(item: User) {
    if (this.mode == 'referees') {
      return item.roles.find(r => r.level == RoleLevel.referee && Boolean(r.extra))?.extra || '';
    } else {
      return item.roles.find(r => r.level == RoleLevel.inspector && Boolean(r.extra))?.extra || '';
    }
  }

  renderCard(user: User) {
    return (
      <ffspb-card href={buildRoute(routes.referee, { refereeId: user._id, refereeName: user.name })}>
        <ffspb-card-head>
          {user.name}
          <ftb-icon svg={ArrowForwardIcon} class="arrow-icon" />
        </ffspb-card-head>
        <ffspb-card-content class="person-card">
          <ftb-user-photo user={user} key={user._id} />
          <table>
            <tbody>
              <tr>
                <td>??????????:</td>
                <td>{user.city || '--'}</td>
              </tr>
              <tr>
                <td>??????????????:</td>
                <td>{user.birthday ? user.getAge() + ' ' + getAgePluralForm(user.getAge()) : '--'}</td>
              </tr>
              <tr>
                <td>??????????????????:</td>
                <td>{this.renderCategory(user) || '--'}</td>
              </tr>
            </tbody>
          </table>
        </ffspb-card-content>
      </ffspb-card>
    );
  }
}
