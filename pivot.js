class PivotData {
  constructor(data, opts) {
    this.inputData = data || [];
    this.colAttrs = opts.colAttrs || [];
    this.rowAttrs = opts.rowAttrs || [];
    this.aggregator = opts.aggregator || aggregator;

    this.tree = {};
    this.colKeys = [];
    this.rowKeys = [];
    this.colKeysMap = {};
    this.rowKeysMap = {};

    this.defoliate = this.aggregator();

    this.init();
  }

  init() {
    this.forEachRecord();

    this.sortColKeys();
    this.sortRowKeys();
  }

  forEachRecord() {
    for (let i = 0, len = this.inputData.length; i < len; i ++) {
      let record = this.inputData[i];
      this.processRecord(record);
    }
  }

  processRecord(record) {
    const rowKey = [];
    const colKey = [];

    this.rowAttrs.forEach((rowAttr) => {
      rowKey.push(record[rowAttr] || '');
    });

    this.colAttrs.forEach((colAttr) => {
      colKey.push(record[colAttr] || '');
    });

    const flatRowKey =  rowKey.join(' ');
    const flatColKey =  colKey.join(' ');

    if (colKey.length > 0) {

      if (!this.colKeysMap[flatColKey]) {

        this.colKeysMap[flatColKey] = this.aggregator();
        this.colKeys.push(colKey);
      }
      this.colKeysMap[flatColKey].push(record);
    }

    if (rowKey.length > 0) {

      if (!this.rowKeysMap[flatRowKey]) {

        this.rowKeysMap[flatRowKey] = this.aggregator();
        this.rowKeys.push(rowKey);
      }
      this.rowKeysMap[flatRowKey].push(record);
    }

    if  (colKey.length > 0 && rowKey.length > 0) {

      if (!this.tree[flatRowKey]) {

        this.tree[flatRowKey] = {};
      }

      if (!this.tree[flatRowKey][flatColKey]) {
        this.tree[flatRowKey][flatColKey] = this.aggregator();
      }

      this.tree[flatRowKey][flatColKey].push(record);
    }
  }

  getAggregator(rowKey, colKey) {
  	const flatRowKey = rowKey.join(' ');
  	const flatColKey = colKey.join(' ');

    if (rowKey.length === 0 && colKey.length === 0) {

      return this.aggregator().push(this.inputData);
    } else if (rowKey.length === 0) {

      return this.colKeysMap[flatColKey];
    } else if(colKey.length === 0) {

      return this.rowKeysMap[flatRowKey];
    } else {

      const branch = this.tree[flatRowKey];

      const Aggregator = branch ? branch[flatColKey] : null;

      return Aggregator || this.defoliate;
    }
  }

  sortColKeys() {
    this.colKeys = this.colKeys.sort(compareArr);
  }

  sortRowKeys() {
    this.rowKeys = this.rowKeys.sort(compareArr);
  }
}

function aggregator() {
	return {
		data: [],
		push: function (record) {
	  	if (Array.isArray(record)) {
  			this.data = this.data.concat(record);
	  	} else {
		    this.data.push(record);
	  	}
	  	return this;
		},
		format() {
			return this.data.length;
		},
	};
}


function compareArr(a, b, index) {

  let i = index || 0;

  if (i >= a.length || i >= b.length) {

    return 1;
  }

  if (a[i] > b[i]) {

    return 1;
  } else if (a[i] < b[i]) {

    return -1;
  } else {

    return compareArr(a, b, ++i);
  }
}

function spanSize(arr, i, j) {
  let l, len, n, noDraw, ref, ref1, stop, x;
  if (i !== 0) {
    noDraw = true;
    for (x = l = 0, ref = j; 0 <= ref ? l <= ref : l >= ref; x = 0 <= ref ? ++l : --l) {
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false;
      }
    }
    if (noDraw) {
      return -1;
    }
  }
  len = 0;
  while (i + len < arr.length) {
    stop = false;
    for (x = n = 0, ref1 = j; 0 <= ref1 ? n <= ref1 : n >= ref1; x = 0 <= ref1 ? ++n : --n) {
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true;
      }
    }
    if (stop) {
      break;
    }
    len++;
  }
  return len;
};

function pivotTableRender(pivotData, opts) {
	let renderOptions = {
		isShowAttr: true,
    isShowCount: false,
	};
	renderOptions = Object.assign(renderOptions, opts);

  const colAttrs = pivotData.colAttrs;
  const rowAttrs = pivotData.rowAttrs;
  const colKeys = pivotData.colKeys;
  const rowKeys = pivotData.rowKeys;

  const pivotTable = document.createElement('table');
  const thead = document.createElement('thead');

  for (let iColAttrs = 0, lenColAttrs = colAttrs.length; iColAttrs < lenColAttrs; iColAttrs++) {
  
    const tr = document.createElement('tr');

    if (iColAttrs === 0) {

    	if (rowAttrs.length > 0) {
	      const th = document.createElement('th');
	      th.setAttribute('colspan', rowAttrs.length);
	      th.setAttribute('rowspan', colAttrs.length);
	      tr.appendChild(th);
    	}

      if (rowAttrs.length === 0 && renderOptions.isShowCount && !renderOptions.isShowAttr) {
	      const th = document.createElement('th');
	      th.setAttribute('rowspan', colAttrs.length);
	      tr.appendChild(th);
	    }
    }

    if (renderOptions.isShowAttr) {
	    const th = document.createElement('th');
	    th.textContent = colAttrs[iColAttrs];
	    tr.appendChild(th);
    }

    for (let i = 0, len = colKeys.length ; i < len; i++) {

      const colSpan = spanSize(colKeys, i, iColAttrs);

      if (colSpan !== -1) {

        const th = document.createElement('th');
        th.textContent = colKeys[i][iColAttrs];
        th.setAttribute('colspan', colSpan);

        if (renderOptions.isShowAttr && rowAttrs.length > 0 && iColAttrs === lenColAttrs - 1) {
        	th.setAttribute('rowspan', 2);
        }

        tr.appendChild(th);
      }
    }

    if (iColAttrs === 0 && renderOptions.isShowCount) {

      const th = document.createElement('th');
      th.textContent = '合计';
      th.setAttribute('rowspan', colAttrs.length + ( rowAttrs.length === 0 ? 0 : 1 ));
      tr.appendChild(th);
    }

    thead.appendChild(tr);
  }

  if (renderOptions.isShowAttr && rowAttrs.length > 0) {
	  const tr = document.createElement('tr');
	  for (let i = 0, len = rowAttrs.length; i < len; i++) {

	  	const th = document.createElement('th');
	  	th.textContent = rowAttrs[i];
	  	tr.appendChild(th);
	  }

	  if (colAttrs.length === 0 && renderOptions.isShowCount) {

	  	const th = document.createElement('th');
	  	th.textContent = '合计';
	  	tr.appendChild(th);
	  }

	  thead.appendChild(tr);
  }

  pivotTable.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let iRowKeys = 0, lenRowKeys = rowKeys.length; iRowKeys < lenRowKeys; iRowKeys++) {
  	
  	const tr = document.createElement('tr');

  	for (let i = 0, len = rowKeys[iRowKeys].length; i < len; i++) {

      const rowSpan = spanSize(rowKeys, iRowKeys, i);

      if (rowSpan !== -1) {

        const th = document.createElement('th');
        th.textContent = rowKeys[iRowKeys][i];
        th.setAttribute('rowspan', rowSpan);

        if (renderOptions.isShowAttr && colAttrs.length > 0 && i === len - 1) {
          th.setAttribute('colspan', 2);
        }

        tr.appendChild(th);
      }
  	}

  	for (let i = 0, len = colKeys.length; i < len; i++) {
  		
  		const td = document.createElement('td');
  		td.innerHTML = pivotData.getAggregator(rowKeys[iRowKeys], colKeys[i]).format();

  		tr.appendChild(td);
  	}

    if (renderOptions.isShowCount) {

      const td = document.createElement('td');
      td.innerHTML = pivotData.getAggregator(rowKeys[iRowKeys], []).format();
      tr.appendChild(td);
    }

  	tbody.appendChild(tr);
  }

  pivotTable.appendChild(tbody);

  if (renderOptions.isShowCount) {

    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.textContent = '合计';
    th.setAttribute('colspan', rowAttrs.length + ( colAttrs.length === 0 || !renderOptions.isShowAttr ? 0 : 1 ));
    tr.appendChild(th);

    for (let i =0, len = colKeys.length; i < len; i++) {

      const td = document.createElement('td');
      td.innerHTML = pivotData.getAggregator([], colKeys[i]).format();

      tr.appendChild(td);
    }

    const td = document.createElement('td');
    td.innerHTML = pivotData.getAggregator([], []).format();
    tr.appendChild(td);

    pivotTable.appendChild(tr);
  }

  return pivotTable;
}


