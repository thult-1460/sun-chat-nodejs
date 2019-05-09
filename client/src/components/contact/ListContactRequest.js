import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, Checkbox, Spin, message } from 'antd';
import { getContactRequest, getNumberContactRequest } from '../../api/contact';
const CheckboxGroup = Checkbox.Group;

class ListContactRequest extends React.Component {
  state = {
    data: [],
    error: '',
    loading: false,
    hasMore: true,
    checkedList: [],
    checkAll: false,
    indeterminate: false,
    allItem: [],
    page: 1,
    numberAlldata: 0,
  };

  fetchData = page => {
    getContactRequest(page).then(res => {
      const { data, allItem } = this.state;
      res.data.result.map(item => {
        allItem.push(item._id);
        data.push(item);
      });
      this.setState({
        data: data,
        allItem: allItem,
        page: page,
        loading: false,
      });
    });
  };

  componentDidMount() {
    const { page } = this.state;
    this.fetchData(page);

    getNumberContactRequest().then(res => {
      this.setState({
        numberAlldata: res.data.result,
      });
    });
  }

  onChange = checkedList => {
    const { allItem } = this.state;
    this.setState({
      checkedList,
      indeterminate: checkedList.length && checkedList.length < allItem.length,
      checkAll: checkedList.length === allItem.length,
    });
  };

  onCheckAllChange = e => {
    const { allItem } = this.state;
    this.setState({
      checkedList: e.target.checked ? allItem : [],
      indeterminate: false,
      checkAll: e.target.checked,
    });
  };

  handleInfiniteOnLoad = () => {
    let { page, data, numberAlldata } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (data.length >= numberAlldata) {
      message.warning('List have loaded alll');
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage);
  };

  render() {
    return (
      <React.Fragment>
        <h2 className="title-contact">List contact request ({this.state.numberAlldata})</h2>
        {this.state.data.length > 0 ? (
          <div>
            <div className="infinite-container">
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.state.loading && this.state.hasMore}
                useWindow={false}
              >
                <CheckboxGroup onChange={this.onChange} value={this.state.checkedList}>
                  <List
                    dataSource={this.state.data}
                    renderItem={item => (
                      <List.Item key={item._id}>
                        <Checkbox value={item._id} className="item-checkbox" />
                        <List.Item.Meta
                          avatar={<Avatar src={item.avatar} />}
                          title={<a href="https://ant.design">{item.name}</a>}
                          description={item.email}
                        />

                        <Button.Group className="btn-accept">
                          <Button type="primary">Accept</Button>
                          <Button>Delete</Button>
                        </Button.Group>
                      </List.Item>
                    )}
                  >
                    {this.state.loading && this.state.hasMore && (
                      <div className="demo-loading-container">
                        <Spin tip="Loading..." />
                      </div>
                    )}
                  </List>
                </CheckboxGroup>
              </InfiniteScroll>
            </div>
            <div className="contact-check-all">
              <Checkbox
                indeterminate={this.state.indeterminate}
                onChange={this.onCheckAllChange}
                checked={this.state.checkAll}
              >
                Check all
              </Checkbox>
              <Button.Group className="btn-all-accept">
                <Button type="primary">Accept</Button>
                <Button>Delete</Button>
              </Button.Group>
            </div>
          </div>
        ) : (
          <div className="title-contact"> No request</div>
        )}
      </React.Fragment>
    );
  }
}

export default ListContactRequest;
